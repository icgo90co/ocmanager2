-- AlterTable
ALTER TABLE `ordenes_compra` MODIFY `origen` ENUM('archivo', 'manual', 'api', 'ai') NOT NULL DEFAULT 'manual';
