-- 請先選擇目標資料庫後再匯入；本檔不建立資料庫或 member 資料表。
DROP SCHEMA IF EXISTS final_team3;

CREATE SCHEMA IF NOT EXISTS final_team3;

USE final_team3;

SET FOREIGN_KEY_CHECKS = 0;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. 建立資料表（不建立 UNIQUE KEY / FOREIGN KEY）
CREATE TABLE `members` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '會員列表';

CREATE TABLE `events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `event_slug` VARCHAR(50) NOT NULL,
    `event_banner` VARCHAR(255) NOT NULL,
    `event_content` MEDIUMTEXT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '活動列表';

CREATE TABLE `event_products` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id_fk` INT NOT NULL,
    `event_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '活動商品列表';

CREATE TABLE `product_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `tag_class` TINYINT NOT NULL,
    `tag` VARCHAR(5) NOT NULL,
    `tag_name` VARCHAR(10) NOT NULL,
    `tag_slug` VARCHAR(30) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品標籤列表';

CREATE TABLE `products` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sku_base` VARCHAR(20) NOT NULL,
    `pet_tag_id_fk` INT NOT NULL,
    `usage_id_fk` INT NOT NULL,
    `has_tag` TINYINT NOT NULL,
    `prod_name` VARCHAR(50) NOT NULL,
    `prod_slogan` VARCHAR(50) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '商品列表';

CREATE TABLE `product_intros` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id_fk` INT NOT NULL,
    `intro_type` ENUM(
        'avatar',
        'description',
        'link',
        'remark'
    ) NOT NULL,
    `intro_content` JSON NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品頁面內容列表';

CREATE TABLE `product_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(30) NOT NULL,
    `product_id_fk` INT NOT NULL,
    `item_no` INT NOT NULL,
    `item_name` VARCHAR(10) NOT NULL,
    `size` ENUM('S', 'M', 'L', 'F') NOT NULL,
    `size_info` VARCHAR(10) NOT NULL,
    `price` INT NOT NULL,
    `sold` INT NOT NULL DEFAULT 0,
    `stock` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '品項列表';

CREATE TABLE `product_s_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id_fk` INT NOT NULL,
    `tag_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品對應特殊標籤';

CREATE TABLE `user_favorites` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `product_id_fk` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '用戶收藏商品清單';

-- 2. 建立 UNIQUE KEY
ALTER TABLE `events`
ADD CONSTRAINT `uq_events_event_slug` UNIQUE (`event_slug`);

ALTER TABLE `event_products`
ADD CONSTRAINT `uq_event_products_product_event` UNIQUE (
    `product_id_fk`,
    `event_id_fk`
);

ALTER TABLE `product_tags`
ADD CONSTRAINT `uq_product_tags_class_tag` UNIQUE (`tag_class`, `tag`),
ADD CONSTRAINT `uq_product_tags_class_name` UNIQUE (`tag_class`, `tag_name`),
ADD CONSTRAINT `uq_product_tags_slug` UNIQUE (`tag_slug`);

ALTER TABLE `products`
ADD CONSTRAINT `uq_products_sku_base` UNIQUE (`sku_base`),
ADD CONSTRAINT `uq_products_tag_usage_name` UNIQUE (
    `pet_tag_id_fk`,
    `usage_id_fk`,
    `prod_name`
);

ALTER TABLE `product_intros`
ADD CONSTRAINT `uq_product_intros_product_type` UNIQUE (`product_id_fk`, `intro_type`);

ALTER TABLE `product_items`
ADD CONSTRAINT `uq_product_items_product_item_name_size` UNIQUE (
    `product_id_fk`,
    `item_no`,
    `item_name`,
    `size`
),
ADD CONSTRAINT `uq_product_items_product_item_size_info` UNIQUE (
    `product_id_fk`,
    `item_no`,
    `size_info`
),
ADD CONSTRAINT `uq_product_items_sku` UNIQUE (`sku`);

ALTER TABLE `product_s_tags`
ADD CONSTRAINT `uq_product_s_tags_product_tag` UNIQUE (`product_id_fk`, `tag_id_fk`);

ALTER TABLE `user_favorites`
ADD CONSTRAINT `uq_user_favorites_member_product` UNIQUE (
    `member_id_fk`,
    `product_id_fk`
);

-- 3. 建立 FOREIGN KEY
ALTER TABLE `event_products`
ADD CONSTRAINT `fk_event_products_product` FOREIGN KEY (`product_id_fk`) REFERENCES `products` (`id`),
ADD CONSTRAINT `fk_event_products_event` FOREIGN KEY (`event_id_fk`) REFERENCES `events` (`id`);

ALTER TABLE `products`
ADD CONSTRAINT `fk_products_pet_tag` FOREIGN KEY (`pet_tag_id_fk`) REFERENCES `product_tags` (`id`),
ADD CONSTRAINT `fk_products_usage_tag` FOREIGN KEY (`usage_id_fk`) REFERENCES `product_tags` (`id`);

ALTER TABLE `product_intros`
ADD CONSTRAINT `fk_product_intros_product` FOREIGN KEY (`product_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `product_items`
ADD CONSTRAINT `fk_product_items_product` FOREIGN KEY (`product_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `product_s_tags`
ADD CONSTRAINT `fk_product_s_tags_product` FOREIGN KEY (`product_id_fk`) REFERENCES `products` (`id`),
ADD CONSTRAINT `fk_product_s_tags_tag` FOREIGN KEY (`tag_id_fk`) REFERENCES `product_tags` (`id`);

ALTER TABLE `user_favorites`
ADD CONSTRAINT `fk_user_favorites_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_user_favorites_product` FOREIGN KEY (`product_id_fk`) REFERENCES `products` (`id`);