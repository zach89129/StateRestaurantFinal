ALTER TABLE `customers`
  ADD COLUMN `is_new_order_guide_user` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `order_guide_pricing_venue_id` INTEGER NULL;

CREATE INDEX `customers_new_order_guide_idx`
  ON `customers`(`is_new_order_guide_user`, `order_guide_pricing_venue_id`);

UPDATE `customers` c
LEFT JOIN `customer_order_guide_features` f
  ON f.`customer_id` = c.`trx_customer_id`
SET
  c.`is_new_order_guide_user` = COALESCE(f.`enabled`, false),
  c.`order_guide_pricing_venue_id` = f.`default_venue_id`;

CREATE TABLE `order_guide_drafts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `customer_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `order_guide_drafts_customer_id_key`(`customer_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `order_guide_draft_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `draft_id` INTEGER NOT NULL,
  `product_id` BIGINT NOT NULL,
  `quantity` INTEGER NOT NULL,
  `source_type` VARCHAR(50) NOT NULL DEFAULT 'ORDER_GUIDE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `order_guide_draft_items_draft_product_unique`(`draft_id`, `product_id`),
  INDEX `order_guide_draft_items_draft_idx`(`draft_id`),
  INDEX `order_guide_draft_items_product_idx`(`product_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_guide_drafts`
  ADD CONSTRAINT `order_guide_drafts_customer_id_fkey`
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`trx_customer_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `order_guide_draft_items`
  ADD CONSTRAINT `order_guide_draft_items_draft_id_fkey`
  FOREIGN KEY (`draft_id`) REFERENCES `order_guide_drafts`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `order_guide_draft_items`
  ADD CONSTRAINT `order_guide_draft_items_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products`(`trx_product_id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `order_guide_drafts`
  ADD COLUMN `is_locked` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `submitted_at` DATETIME(3) NULL;

CREATE INDEX `order_guide_drafts_customer_locked_idx`
  ON `order_guide_drafts`(`customer_id`, `is_locked`);
