-- AlterTable: Actualizar valores existentes antes de modificar el enum
UPDATE `ordenes_compra` SET `estado` = 'procesando' WHERE `estado` = 'en_proceso';
UPDATE `ordenes_compra` SET `estado` = 'procesada' WHERE `estado` = 'finalizada';
UPDATE `ordenes_compra` SET `estado` = 'anulada' WHERE `estado` = 'cancelada';

UPDATE `ordenes_venta` SET `estado` = 'procesando' WHERE `estado` = 'en_proceso';
UPDATE `ordenes_venta` SET `estado` = 'procesada' WHERE `estado` = 'finalizada';
UPDATE `ordenes_venta` SET `estado` = 'anulada' WHERE `estado` = 'cancelada';

-- Modificar el enum EstadoOrden
ALTER TABLE `ordenes_compra` MODIFY COLUMN `estado` ENUM('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho') NOT NULL DEFAULT 'recibida';

ALTER TABLE `ordenes_venta` MODIFY COLUMN `estado` ENUM('recibida', 'procesando', 'pendiente_ajustes', 'procesada', 'anulada', 'en_despacho') NOT NULL DEFAULT 'recibida';
