import { Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import XLSX from 'xlsx';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import geminiService from '../services/gemini.service';
import { logger } from '../utils/logger';

const VALID_TRANSITIONS: Record<string, string[]> = {
  recibida: ['procesando', 'anulada'],
  procesando: ['pendiente_ajustes', 'procesada', 'anulada'],
  pendiente_ajustes: ['procesando', 'anulada'],
  procesada: [],
  anulada: [],
};

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { estado, clienteId, codigoOc } = req.query;
    
    const where: any = {};
    
    // Si es cliente, solo ver sus órdenes
    if (req.user?.role === 'cliente') {
      where.clienteId = req.user.clienteId;
    } else if (clienteId) {
      where.clienteId = parseInt(clienteId as string);
    }
    
    if (estado) {
      where.estado = estado;
    }
    
    if (codigoOc) {
      where.codigoOc = { contains: codigoOc as string };
    }

    const ordenes = await prisma.ordenCompra.findMany({
      where,
      include: {
        cliente: { select: { nombreLegal: true } },
        items: { include: { producto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: ordenes });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        items: { include: { producto: true } },
        archivo: true,
        ordenesVenta: { select: { id: true, codigoOv: true, estado: true } },
      },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden de compra no encontrada');
    }

    // Verificar permisos
    if (req.user?.role === 'cliente' && orden.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para ver esta orden');
    }

    res.json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clienteId, items, notas, moneda = 'COP' } = req.body;

    // Verificar permisos
    if (req.user?.role === 'cliente' && clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No puede crear órdenes para otros clientes');
    }

    // Generar código OC
    const count = await prisma.ordenCompra.count();
    const codigoOc = `OC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Calcular totales
    let total = new Decimal(0);
    const itemsData = items.map((item: any) => {
      const subtotal = new Decimal(item.cantidad).mul(new Decimal(item.precioUnitario));
      total = total.add(subtotal);
      return {
        ...item,
        subtotal: subtotal.toNumber(),
      };
    });

    const orden = await prisma.ordenCompra.create({
      data: {
        codigoOc,
        clienteId,
        total: total.toNumber(),
        moneda,
        notas,
        origen: 'manual',
        items: {
          create: itemsData,
        },
      },
      include: { items: true, cliente: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenCompra',
        entidadId: orden.id,
        accion: 'CREATE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No se proporcionó ningún archivo');
    }

    const { clienteId, useAI } = req.body;

    // Verificar permisos
    if (req.user?.role === 'cliente' && parseInt(clienteId) !== req.user.clienteId) {
      throw new ApiError(403, 'No puede subir archivos para otros clientes');
    }

    // Guardar archivo
    const archivo = await prisma.archivo.create({
      data: {
        nombre: req.file.originalname,
        tipoMime: req.file.mimetype,
        tamano: req.file.size,
        ruta: req.file.path,
        uploaderUserId: req.user!.id,
      },
    });

    // Si se solicita procesamiento con IA
    if (useAI === 'true' || useAI === true) {
      logger.info('Procesando archivo con IA Gemini...');
      
      try {
        const extractedData = await geminiService.procesarOrdenCompra(
          req.file.path,
          req.file.mimetype
        );

        // Buscar o sugerir cliente
        let clienteIdFound = clienteId ? parseInt(clienteId) : null;
        
        if (!clienteIdFound && extractedData.cliente?.nit) {
          const clienteExistente = await prisma.cliente.findFirst({
            where: { nit: extractedData.cliente.nit },
          });
          clienteIdFound = clienteExistente?.id || null;
        }

        // Procesar productos y buscar coincidencias
        const productosData = await Promise.all(
          extractedData.productos.map(async (item) => {
            let productoId = null;
            
            // Buscar producto por SKU si existe
            if (item.sku) {
              const producto = await prisma.producto.findUnique({
                where: { sku: item.sku },
              });
              productoId = producto?.id || null;
            }

            // Si no se encontró producto, sugerir SKU con IA
            if (!productoId && !item.sku) {
              item.sku = await geminiService.sugerirSKU(item.descripcion);
            }

            return {
              productoId,
              sku: item.sku || 'TEMP-' + Date.now(),
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
            };
          })
        );

        return res.json({
          success: true,
          data: {
            archivoId: archivo.id,
            aiProcessed: true,
            extractedData: {
              numeroOrden: extractedData.numeroOrden,
              clienteId: clienteIdFound,
              clienteData: extractedData.cliente,
              productos: productosData,
              subtotal: extractedData.subtotal,
              impuestos: extractedData.impuestos,
              total: extractedData.total,
              moneda: extractedData.moneda || 'COP',
              fecha: extractedData.fecha,
              observaciones: extractedData.observaciones,
            },
          },
        });
      } catch (aiError) {
        logger.error({ error: aiError }, 'Error en procesamiento con IA, usando método tradicional');
        // Si falla la IA, continuar con método tradicional
      }
    }

    // Método tradicional: parsear archivo Excel/CSV
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Detectar columnas
    const headers = data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];

    return res.json({
      success: true,
      data: {
        archivoId: archivo.id,
        aiProcessed: false,
        headers,
        preview: data.slice(0, 5),
        totalRows: data.length,
      },
    });
  } catch (error) {
    // Eliminar archivo si hay error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    return next(error);
  }
};

export const confirmUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { 
      archivoId, 
      columnMapping, 
      clienteId, 
      moneda = 'COP', 
      notas,
      aiProcessed,
      extractedData 
    } = req.body;

    let items: any[] = [];
    let total = new Decimal(0);

    // Si fue procesado con IA, usar los datos extraídos
    if (aiProcessed && extractedData) {
      logger.info('Confirmando orden procesada con IA');

      // Validar y procesar productos extraídos por IA
      for (const item of extractedData.productos) {
        const cantidad = parseFloat(item.cantidad);
        const precioUnitario = parseFloat(item.precioUnitario);

        if (!cantidad || cantidad <= 0 || precioUnitario < 0) {
          continue;
        }

        // Si se proporcionó productoId, verificar que existe
        let productoId = item.productoId;
        if (productoId) {
          const producto = await prisma.producto.findUnique({ 
            where: { id: productoId } 
          });
          if (!producto) {
            productoId = null;
          }
        }

        // Si no hay producto pero hay SKU, intentar buscar
        if (!productoId && item.sku) {
          const producto = await prisma.producto.findUnique({ 
            where: { sku: item.sku } 
          });
          productoId = producto?.id || null;
        }

        const subtotal = new Decimal(cantidad).mul(new Decimal(precioUnitario));
        total = total.add(subtotal);

        items.push({
          productoId,
          sku: item.sku,
          descripcion: item.descripcion,
          cantidad,
          precioUnitario,
          subtotal: subtotal.toNumber(),
        });
      }

      // Usar total extraído por IA si está disponible
      if (extractedData.total) {
        total = new Decimal(extractedData.total);
      }
    } else {
      // Método tradicional: leer archivo y mapear columnas
      const archivo = await prisma.archivo.findUnique({ where: { id: archivoId } });
      if (!archivo) {
        throw new ApiError(404, 'Archivo no encontrado');
      }

      const workbook = XLSX.readFile(archivo.ruta);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data: any[] = XLSX.utils.sheet_to_json(sheet);

      // Mapear columnas y validar
      for (const row of data) {
        const sku = row[columnMapping.sku];
        const cantidad = parseFloat(row[columnMapping.cantidad]);
        const precioUnitario = parseFloat(row[columnMapping.precioUnitario]);
        const descripcion = row[columnMapping.descripcion] || '';

        if (!sku || !cantidad || cantidad <= 0 || precioUnitario < 0) {
          continue;
        }

        // Buscar producto
        const producto = await prisma.producto.findUnique({ where: { sku } });

        const subtotal = new Decimal(cantidad).mul(new Decimal(precioUnitario));
        total = total.add(subtotal);

        items.push({
          productoId: producto?.id,
          sku,
          descripcion: descripcion || producto?.nombre || sku,
          cantidad,
          precioUnitario,
          subtotal: subtotal.toNumber(),
        });
      }
    }

    if (items.length === 0) {
      throw new ApiError(400, 'No se encontraron productos válidos en el archivo');
    }

    // Generar código OC (usar el extraído por IA si existe)
    let codigoOc = extractedData?.numeroOrden;
    if (!codigoOc) {
      const count = await prisma.ordenCompra.count();
      codigoOc = `OC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    }

    // Crear orden
    const orden = await prisma.ordenCompra.create({
      data: {
        codigoOc,
        clienteId: clienteId || extractedData?.clienteId,
        total: total.toNumber(),
        moneda: extractedData?.moneda || moneda,
        notas: extractedData?.observaciones || notas,
        origen: aiProcessed ? 'ai' : 'archivo',
        archivoId,
        items: { create: items },
      },
      include: { items: true, cliente: true, archivo: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenCompra',
        entidadId: orden.id,
        accion: aiProcessed ? 'CREATE_FROM_AI' : 'CREATE_FROM_FILE',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.status(201).json({ success: true, data: orden });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { notas, items } = req.body;

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    // Verificar permisos
    if (req.user?.role === 'cliente' && orden.clienteId !== req.user.clienteId) {
      throw new ApiError(403, 'No tiene permisos para editar esta orden');
    }

    // Solo permitir edición en ciertos estados
    if (['procesada', 'anulada'].includes(orden.estado)) {
      throw new ApiError(400, 'No se puede editar una orden en estado ' + orden.estado);
    }

    const updated = await prisma.ordenCompra.update({
      where: { id: parseInt(id) },
      data: { notas },
      include: { items: true, cliente: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const changeEstado = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Solo admin puede cambiar estados
    if (req.user?.role !== 'admin') {
      throw new ApiError(403, 'Solo administradores pueden cambiar estados');
    }

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
    });

    if (!orden) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    // Validar transición
    if (!VALID_TRANSITIONS[orden.estado]?.includes(estado)) {
      throw new ApiError(400, `No se puede cambiar de ${orden.estado} a ${estado}`);
    }

    const updated = await prisma.ordenCompra.update({
      where: { id: parseInt(id) },
      data: { estado },
      include: { items: true, cliente: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        entidad: 'OrdenCompra',
        entidadId: orden.id,
        accion: 'CHANGE_ESTADO',
        diffJson: JSON.stringify({ from: orden.estado, to: estado }),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
