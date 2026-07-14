-- final_team3 完整建表檔 v2
-- 會刪除並重建整個 final_team3 資料庫。
-- 寵物欄位已採用：活動量單選、健康情況多選、過敏食材多選；不使用 body_size。

DROP SCHEMA IF EXISTS `final_team3`;

CREATE SCHEMA `final_team3`;

USE `final_team3`;

-- 1. 建立資料表
CREATE TABLE `members` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '會員列表';

CREATE TABLE `events` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `event_slug` VARCHAR(50) NOT NULL,
    `event_banner` TEXT NOT NULL,
    `event_content` TEXT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '活動列表';

CREATE TABLE `event_products` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prod_id_fk` INT NOT NULL,
    `event_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '活動商品列表';

CREATE TABLE `products` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prod_name` VARCHAR(50) NOT NULL,
    `price` INT NOT NULL,
    `pet_tag_id_fk` INT NOT NULL,
    `category_id_fk` INT NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '商品列表';

CREATE TABLE `product_intros` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prod_id_fk` INT NOT NULL,
    `intro_type` ENUM('slogan', 'content', 'remark') NOT NULL,
    `intro_text` TEXT,
    PRIMARY KEY (`id`)
) COMMENT = '商品描述列表';

CREATE TABLE `items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(50) NOT NULL,
    `prod_id_fk` INT NOT NULL,
    `item_name` VARCHAR(50) NOT NULL,
    `sold` INT NOT NULL DEFAULT 0,
    `stock` INT NOT NULL DEFAULT 999,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '品項列表';

CREATE TABLE `product_special_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `tag_ch` VARCHAR(50) NOT NULL,
    `tag_slug` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品標籤列表';

CREATE TABLE `product_pet_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `tag_code` VARCHAR(10) NOT NULL,
    `tag_ch` VARCHAR(50) NOT NULL,
    `tag_slug` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品寵物分類列表';

CREATE TABLE `product_category_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `tag_code` VARCHAR(10) NOT NULL,
    `tag_ch` VARCHAR(50) NOT NULL,
    `tag_slug` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品類別列表';

CREATE TABLE `item_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `item_id_fk` INT NOT NULL,
    `tag_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品品項對應特殊標籤';

CREATE TABLE `keywords` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `keyword` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '關鍵字列表';

CREATE TABLE `item_keywords` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `item_id_fk` INT NOT NULL,
    `keyword_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品品項對應關鍵字';

CREATE TABLE `product_avatars` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prod_id_fk` INT NOT NULL,
    `src` TEXT NOT NULL,
    `thumbnail` TEXT NOT NULL,
    `avatar_order` TINYINT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品縮圖列表';

CREATE TABLE `product_images` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `prod_id_fk` INT NOT NULL,
    `src` TEXT NOT NULL,
    `image_order` TINYINT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '商品說明圖列表';

CREATE TABLE `user_favorites` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `prod_id_fk` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '用戶收藏商品清單';

-- 寵物：單選資料直接存在 pets；多選資料統一存在 pet_selected_options。
CREATE TABLE `pet_attributes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `group_name` VARCHAR(50) NOT NULL,
    `group_code` VARCHAR(50) NOT NULL,
    `selection_type` ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
    `is_required` TINYINT NOT NULL DEFAULT 0,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `is_filter` TINYINT NOT NULL DEFAULT 0,
    `sort` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) COMMENT = '寵物屬性群組';

CREATE TABLE `pet_attr_details` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `pet_attr_id_fk` INT NOT NULL,
    `attr_option` VARCHAR(50) NOT NULL,
    `option_code` VARCHAR(50) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) COMMENT = '寵物屬性選項';

CREATE TABLE `pets` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `pet_name` VARCHAR(50) NOT NULL,
    `avatar_url` VARCHAR(255),
    `species_option_id_fk` INT NOT NULL,
    `breed_text` VARCHAR(100),
    `gender_option_id_fk` INT,
    `neutered_option_id_fk` INT,
    `activity_level_option_id_fk` INT,
    `birthday` DATE,
    `weight` DECIMAL(5, 2),
    `special_note` TEXT,
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `deleted_at` DATETIME,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '會員寵物資料';

CREATE TABLE `pet_selected_options` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `pet_id_fk` INT NOT NULL,
    `option_group_id_fk` INT NOT NULL,
    `option_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '寵物多選屬性關聯表';

CREATE TABLE `pet_ai_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `pet_id_fk` INT NOT NULL,
    `entry_source` VARCHAR(50) NOT NULL DEFAULT 'pet_dashboard',
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `recommended_product_ids` VARCHAR(255),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '寵物 AI 導購問答紀錄';

-- 2. UNIQUE KEY
ALTER TABLE `events`
ADD CONSTRAINT `uq_events_event_slug` UNIQUE (`event_slug`);

ALTER TABLE `event_products`
ADD CONSTRAINT `uq_event_products_product_event` UNIQUE (`prod_id_fk`, `event_id_fk`);

ALTER TABLE `products` ADD CONSTRAINT `uq_slug` UNIQUE (`slug`);

ALTER TABLE `product_intros`
ADD CONSTRAINT `uq_product_intros_product_type` UNIQUE (`prod_id_fk`, `intro_type`);

ALTER TABLE `items`
ADD CONSTRAINT `uq_product_item_name` UNIQUE (`prod_id_fk`, `item_name`),
ADD CONSTRAINT `uq_sku` UNIQUE (`sku`);

ALTER TABLE `product_special_tags`
ADD CONSTRAINT `uq_special_tag_ch` UNIQUE (`tag_ch`),
ADD CONSTRAINT `uq_special_tag_slug` UNIQUE (`tag_slug`);

ALTER TABLE `product_pet_tags`
ADD CONSTRAINT `uq_pet_tag_code` UNIQUE (`tag_code`),
ADD CONSTRAINT `uq_pet_tag_ch` UNIQUE (`tag_ch`),
ADD CONSTRAINT `uq_pet_tag_slug` UNIQUE (`tag_slug`);

ALTER TABLE `product_category_tags`
ADD CONSTRAINT `uq_category_tag_code` UNIQUE (`tag_code`),
ADD CONSTRAINT `uq_category_tag_ch` UNIQUE (`tag_ch`),
ADD CONSTRAINT `uq_category_tag_slug` UNIQUE (`tag_slug`);

ALTER TABLE `item_tags`
ADD CONSTRAINT `uq_item_tag` UNIQUE (`item_id_fk`, `tag_id_fk`);

ALTER TABLE `keywords`
ADD CONSTRAINT `uq_keyword` UNIQUE (`keyword`),
ADD CONSTRAINT `uq_keyword_slug` UNIQUE (`slug`);

ALTER TABLE `item_keywords`
ADD CONSTRAINT `uq_item_keyword` UNIQUE (`item_id_fk`, `keyword_id_fk`);

ALTER TABLE `product_avatars`
ADD CONSTRAINT `uq_product_avatar_order` UNIQUE (`prod_id_fk`, `avatar_order`);

ALTER TABLE `product_images`
ADD CONSTRAINT `uq_product_image_order` UNIQUE (`prod_id_fk`, `image_order`);

ALTER TABLE `user_favorites`
ADD CONSTRAINT `uq_user_favorites_member_product` UNIQUE (`member_id_fk`, `prod_id_fk`);

ALTER TABLE `pet_attributes`
ADD CONSTRAINT `uq_pet_attributes_group_code` UNIQUE (`group_code`);

ALTER TABLE `pet_attr_details`
ADD CONSTRAINT `uq_pet_attr_details_group_option` UNIQUE (
    `pet_attr_id_fk`,
    `option_code`
);

ALTER TABLE `pet_selected_options`
ADD CONSTRAINT `uq_pet_selected_option` UNIQUE (
    `pet_id_fk`,
    `option_group_id_fk`,
    `option_id_fk`
);

-- 3. FOREIGN KEY
ALTER TABLE `event_products`
ADD CONSTRAINT `fk_event_products_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`),
ADD CONSTRAINT `fk_event_products_event` FOREIGN KEY (`event_id_fk`) REFERENCES `events` (`id`);

ALTER TABLE `products`
ADD CONSTRAINT `fk_products_pet_tag` FOREIGN KEY (`pet_tag_id_fk`) REFERENCES `product_pet_tags` (`id`),
ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id_fk`) REFERENCES `product_category_tags` (`id`);

ALTER TABLE `product_intros`
ADD CONSTRAINT `fk_product_intros_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `items`
ADD CONSTRAINT `fk_items_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `item_tags`
ADD CONSTRAINT `fk_item_tags_item` FOREIGN KEY (`item_id_fk`) REFERENCES `items` (`id`),
ADD CONSTRAINT `fk_item_tags_tag` FOREIGN KEY (`tag_id_fk`) REFERENCES `product_special_tags` (`id`);

ALTER TABLE `item_keywords`
ADD CONSTRAINT `fk_item_keywords_item` FOREIGN KEY (`item_id_fk`) REFERENCES `items` (`id`),
ADD CONSTRAINT `fk_item_keywords_keyword` FOREIGN KEY (`keyword_id_fk`) REFERENCES `keywords` (`id`);

ALTER TABLE `product_avatars`
ADD CONSTRAINT `fk_product_avatars_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `product_images`
ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `user_favorites`
ADD CONSTRAINT `fk_user_favorites_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_user_favorites_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `pet_attr_details`
ADD CONSTRAINT `fk_pet_attr_details_attribute` FOREIGN KEY (`pet_attr_id_fk`) REFERENCES `pet_attributes` (`id`);

ALTER TABLE `pets`
ADD CONSTRAINT `fk_pets_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_pets_species_option` FOREIGN KEY (`species_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_gender_option` FOREIGN KEY (`gender_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_neutered_option` FOREIGN KEY (`neutered_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_activity_level_option` FOREIGN KEY (`activity_level_option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_selected_options`
ADD CONSTRAINT `fk_pet_selected_options_pet` FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_group` FOREIGN KEY (`option_group_id_fk`) REFERENCES `pet_attributes` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_option` FOREIGN KEY (`option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_ai_logs`
ADD CONSTRAINT `fk_pet_ai_logs_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_pet_ai_logs_pet` FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`);