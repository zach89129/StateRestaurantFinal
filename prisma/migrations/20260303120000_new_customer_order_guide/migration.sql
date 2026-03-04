CREATE TABLE `customer_order_guide_features` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `customer_id` INTEGER NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `default_venue_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `customer_order_guide_features_customer_id_key`(`customer_id`),
  INDEX `customer_order_guide_features_enabled_default_venue_idx`(`enabled`, `default_venue_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_guide_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT NOT NULL,
  `order_guide_group` VARCHAR(255) NOT NULL,
  `order_guide_quality` VARCHAR(255) NOT NULL,
  `included` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `order_guide_items_product_id_key`(`product_id`),
  INDEX `order_guide_items_lookup_idx`(`included`, `order_guide_group`, `order_guide_quality`, `product_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `customer_order_guide_features`
  ADD CONSTRAINT `customer_order_guide_features_customer_id_fkey`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`trx_customer_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `customer_order_guide_features`
  ADD CONSTRAINT `customer_order_guide_features_default_venue_id_fkey`
  FOREIGN KEY (`default_venue_id`) REFERENCES `venues`(`trx_venue_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `order_guide_items`
  ADD CONSTRAINT `order_guide_items_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products`(`trx_product_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
