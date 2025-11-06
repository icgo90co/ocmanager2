-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `hash_password` VARCHAR(191) NOT NULL,
    `role` ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
    `cliente_id` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_legal` VARCHAR(191) NOT NULL,
    `nit` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `ciudad` VARCHAR(191) NULL,
    `pais` VARCHAR(191) NOT NULL DEFAULT 'Colombia',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clientes_nit_key`(`nit`),
    INDEX `clientes_nit_idx`(`nit`),
    INDEX `clientes_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `unidad` VARCHAR(191) NOT NULL DEFAULT 'UND',
    `precio_base` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `productos_sku_key`(`sku`),
    INDEX `productos_sku_idx`(`sku`),
    INDEX `productos_activo_idx`(`activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_compra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_oc` VARCHAR(191) NOT NULL,
    `cliente_id` INTEGER NOT NULL,
    `total` DECIMAL(15, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `estado` ENUM('recibida', 'en_proceso', 'enviada', 'finalizada', 'cancelada') NOT NULL DEFAULT 'recibida',
    `notas` TEXT NULL,
    `origen` ENUM('archivo', 'manual', 'api') NOT NULL DEFAULT 'manual',
    `archivo_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordenes_compra_codigo_oc_key`(`codigo_oc`),
    INDEX `ordenes_compra_codigo_oc_idx`(`codigo_oc`),
    INDEX `ordenes_compra_cliente_id_idx`(`cliente_id`),
    INDEX `ordenes_compra_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oc_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oc_id` INTEGER NOT NULL,
    `producto_id` INTEGER NULL,
    `sku` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,

    INDEX `oc_items_oc_id_idx`(`oc_id`),
    INDEX `oc_items_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_venta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_ov` VARCHAR(191) NOT NULL,
    `oc_id` INTEGER NULL,
    `cliente_id` INTEGER NOT NULL,
    `total` DECIMAL(15, 2) NOT NULL,
    `moneda` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `estado` ENUM('recibida', 'en_proceso', 'enviada', 'finalizada', 'cancelada') NOT NULL DEFAULT 'recibida',
    `notas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordenes_venta_codigo_ov_key`(`codigo_ov`),
    INDEX `ordenes_venta_codigo_ov_idx`(`codigo_ov`),
    INDEX `ordenes_venta_oc_id_idx`(`oc_id`),
    INDEX `ordenes_venta_cliente_id_idx`(`cliente_id`),
    INDEX `ordenes_venta_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ov_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ov_id` INTEGER NOT NULL,
    `producto_id` INTEGER NULL,
    `sku` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,

    INDEX `ov_items_ov_id_idx`(`ov_id`),
    INDEX `ov_items_producto_id_idx`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ov_id` INTEGER NOT NULL,
    `numero_envio` VARCHAR(191) NOT NULL,
    `carrier` VARCHAR(191) NULL,
    `estado_envio` ENUM('preparando', 'en_transito', 'retenido', 'entregado', 'devuelto') NOT NULL DEFAULT 'preparando',
    `fecha_salida` DATETIME(3) NULL,
    `fecha_entrega_estimada` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `envios_ov_id_key`(`ov_id`),
    UNIQUE INDEX `envios_numero_envio_key`(`numero_envio`),
    INDEX `envios_numero_envio_idx`(`numero_envio`),
    INDEX `envios_estado_envio_idx`(`estado_envio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `envio_eventos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `envio_id` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,
    `ubicacion` VARCHAR(191) NOT NULL,
    `estado_envio` ENUM('preparando', 'en_transito', 'retenido', 'entregado', 'devuelto') NOT NULL,
    `comentario` TEXT NULL,

    INDEX `envio_eventos_envio_id_idx`(`envio_id`),
    INDEX `envio_eventos_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `tipo_mime` VARCHAR(191) NOT NULL,
    `tamano` INTEGER NOT NULL,
    `ruta` VARCHAR(191) NOT NULL,
    `uploader_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `archivos_uploader_user_id_idx`(`uploader_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `entidad` VARCHAR(191) NOT NULL,
    `entidad_id` INTEGER NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `diff_json` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_entidad_entidad_id_idx`(`entidad`, `entidad_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_compra` ADD CONSTRAINT `ordenes_compra_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_compra` ADD CONSTRAINT `ordenes_compra_archivo_id_fkey` FOREIGN KEY (`archivo_id`) REFERENCES `archivos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oc_items` ADD CONSTRAINT `oc_items_oc_id_fkey` FOREIGN KEY (`oc_id`) REFERENCES `ordenes_compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oc_items` ADD CONSTRAINT `oc_items_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_venta` ADD CONSTRAINT `ordenes_venta_oc_id_fkey` FOREIGN KEY (`oc_id`) REFERENCES `ordenes_compra`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_venta` ADD CONSTRAINT `ordenes_venta_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ov_items` ADD CONSTRAINT `ov_items_ov_id_fkey` FOREIGN KEY (`ov_id`) REFERENCES `ordenes_venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ov_items` ADD CONSTRAINT `ov_items_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `envios` ADD CONSTRAINT `envios_ov_id_fkey` FOREIGN KEY (`ov_id`) REFERENCES `ordenes_venta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `envio_eventos` ADD CONSTRAINT `envio_eventos_envio_id_fkey` FOREIGN KEY (`envio_id`) REFERENCES `envios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `archivos` ADD CONSTRAINT `archivos_uploader_user_id_fkey` FOREIGN KEY (`uploader_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

