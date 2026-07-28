-- CreateTable
CREATE TABLE `outbound_shipments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_name` VARCHAR(255) NOT NULL,
    `invoice_number` VARCHAR(255) NOT NULL,
    `created_by_email` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `outbound_shipments_created_at_idx`(`created_at`),
    INDEX `outbound_shipments_invoice_number_idx`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outbound_shipment_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipment_id` INTEGER NOT NULL,
    `blob_pathname` VARCHAR(512) NOT NULL,
    `content_type` VARCHAR(128) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `outbound_shipment_images_shipment_id_idx`(`shipment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `outbound_shipment_images` ADD CONSTRAINT `outbound_shipment_images_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `outbound_shipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
