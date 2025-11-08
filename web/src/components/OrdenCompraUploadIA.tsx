import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ocApi, clientesApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Sparkles, Edit } from 'lucide-react';

interface OrdenCompraUploadIAProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractedItem {
  productoId?: number;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface ExtractedData {
  numeroOrden?: string;
  clienteId?: number;
  clienteData?: {
    nombre?: string;
    nit?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  productos: ExtractedItem[];
  subtotal?: number;
  impuestos?: number;
  total: number;
  moneda?: string;
  fecha?: string;
  observaciones?: string;
}

export function OrdenCompraUploadIA({ open, onOpenChange }: OrdenCompraUploadIAProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [archivoId, setArchivoId] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para edición
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await clientesApi.getAll();
      return res.data.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setProcessing(true);
      setError(null);
      return await ocApi.uploadFile(formData);
    },
    onSuccess: (response) => {
      const { data } = response.data;
      setArchivoId(data.archivoId);
      
      if (data.aiProcessed && data.extractedData) {
        setExtractedData(data.extractedData);
        setEditedData(data.extractedData);
      } else {
        setError('No se pudo procesar el archivo con IA. Por favor, intenta con otro archivo o usa el método manual.');
      }
      setProcessing(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al procesar el archivo');
      setProcessing(false);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ocApi.confirmUpload(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Error al crear la orden');
    },
  });

  const resetForm = () => {
    setFile(null);
    setArchivoId(null);
    setExtractedData(null);
    setEditedData(null);
    setProcessing(false);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Tipo de archivo no soportado. Use PDF, imagen, Excel o CSV.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('useAI', 'true');
    
    uploadMutation.mutate(formData);
  };

  const handleConfirm = () => {
    if (!editedData || !archivoId) return;

    const data = {
      archivoId,
      aiProcessed: true,
      clienteId: editedData.clienteId,
      extractedData: editedData,
    };

    confirmMutation.mutate(data);
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    if (!editedData) return;
    
    const newItems = [...editedData.productos];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalcular subtotal del item
    if (field === 'cantidad' || field === 'precioUnitario') {
      newItems[index].subtotal = newItems[index].cantidad * newItems[index].precioUnitario;
    }
    
    // Recalcular totales
    const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + (editedData.impuestos || 0);
    
    setEditedData({
      ...editedData,
      productos: newItems,
      subtotal,
      total,
    });
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Subir Orden de Compra con IA
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Sube un documento (PDF, imagen, Excel o CSV) y la IA extraerá automáticamente la información
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Paso 1: Selección de archivo */}
          {!extractedData && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {file ? file.name : 'Selecciona un archivo'}
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, JPG, PNG, Excel o CSV hasta 10MB
                  </p>
                </div>

                {file && !processing && (
                  <div className="mt-6">
                    <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Procesar con IA
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {processing && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Procesando con IA Gemini... esto puede tomar unos segundos</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Errores */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900">Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Paso 2: Datos extraídos para edición */}
          {extractedData && editedData && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900">¡Datos extraídos exitosamente!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Revisa y edita la información antes de guardar la orden
                  </p>
                </div>
              </div>

              {/* Información general */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Número de Orden</label>
                  <Input
                    value={editedData.numeroOrden || ''}
                    onChange={(e) => updateField('numeroOrden', e.target.value)}
                    placeholder="Se generará automáticamente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cliente</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editedData.clienteId || ''}
                    onChange={(e) => updateField('clienteId', parseInt(e.target.value))}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes?.map((cliente: any) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombreLegal} {cliente.nit ? `(${cliente.nit})` : ''}
                      </option>
                    ))}
                  </select>
                  {editedData.clienteData?.nombre && (
                    <p className="text-xs text-gray-500 mt-1">
                      Detectado: {editedData.clienteData.nombre}
                      {editedData.clienteData.nit && ` - NIT: ${editedData.clienteData.nit}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha</label>
                  <Input
                    type="date"
                    value={editedData.fecha || ''}
                    onChange={(e) => updateField('fecha', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Moneda</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={editedData.moneda || 'COP'}
                    onChange={(e) => updateField('moneda', e.target.value)}
                  >
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Impuestos</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedData.impuestos || 0}
                    onChange={(e) => {
                      const impuestos = parseFloat(e.target.value) || 0;
                      updateField('impuestos', impuestos);
                      updateField('total', (editedData.subtotal || 0) + impuestos);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Observaciones</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  value={editedData.observaciones || ''}
                  onChange={(e) => updateField('observaciones', e.target.value)}
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Productos Detectados ({editedData.productos.length})
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {editedData.productos.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Producto {index + 1}</span>
                        <Edit className="h-4 w-4 text-gray-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1 text-gray-600">SKU</label>
                          <Input
                            value={item.sku}
                            onChange={(e) => updateItem(index, 'sku', e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-gray-600">Descripción</label>
                          <Input
                            value={item.descripcion}
                            onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs mb-1 text-gray-600">Cantidad</label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad}
                            onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-gray-600">Precio Unitario</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioUnitario}
                            onChange={(e) => updateItem(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            className="text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-gray-600">Subtotal</label>
                          <Input
                            type="text"
                            value={`$ ${item.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`}
                            disabled
                            className="text-sm bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    $ {(editedData.subtotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Impuestos:</span>
                  <span className="font-medium">
                    $ {(editedData.impuestos || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    $ {editedData.total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          
          {extractedData && (
            <Button 
              onClick={handleConfirm} 
              disabled={confirmMutation.isPending || !editedData?.clienteId}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Confirmar y Crear Orden'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
