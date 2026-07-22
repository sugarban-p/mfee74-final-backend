-- final_team3 完整建表檔 v2
-- 會刪除並重建整個 final_team3 資料庫。
-- 寵物欄位已採用：活動量單選、健康情況多選、過敏食材多選；不使用 body_size。

DROP SCHEMA IF EXISTS `final_team3`;

CREATE SCHEMA `final_team3`;

USE `final_team3`;

-- 1. 建立資料表
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_no` VARCHAR(30) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255),
    `name` VARCHAR(120),
    `nickname` VARCHAR(120),
    `phone` VARCHAR(30),
    `address` VARCHAR(255),
    `avatar` VARCHAR(255),
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `email_verified_at` DATETIME NULL,
    `login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` DATETIME NULL,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_users_status` ON `users` (`status`);

CREATE INDEX `idx_users_created` ON `users` (`created_at`);

CREATE TABLE `user_oauth_accounts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `provider` ENUM('GOOGLE') NOT NULL,
    `provider_user_id` VARCHAR(191) NOT NULL,
    `provider_email` VARCHAR(191),
    `provider_name` VARCHAR(120),
    `provider_avatar` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_oauth_user` ON `user_oauth_accounts` (`user_id`);

CREATE TABLE `sessions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `access_token_hash` CHAR(64) NOT NULL,
    `refresh_token_hash` CHAR(64) NOT NULL,
    `user_agent` VARCHAR(255),
    `ip` VARCHAR(64),
    `device_name` VARCHAR(100),
    `expires_at` DATETIME NOT NULL,
    `revoked_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);

CREATE INDEX `idx_sessions_expire` ON `sessions` (`expires_at`);

CREATE TABLE `otp_codes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `type` ENUM(
        'EMAIL_VERIFY',
        'FORGOT_PASSWORD'
    ) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` BOOLEAN DEFAULT FALSE,
    `attempts` INT DEFAULT 0,
    `send_count` INT DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_otp_search` ON `otp_codes` (`user_id`, `type`, `used`);

CREATE TABLE `login_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NULL,
    `email` VARCHAR(191),
    `method` ENUM('PASSWORD', 'GOOGLE') DEFAULT 'PASSWORD',
    `ip` VARCHAR(64),
    `country` VARCHAR(100),
    `city` VARCHAR(100),
    `user_agent` VARCHAR(255),
    `browser` VARCHAR(120),
    `os` VARCHAR(120),
    `device` VARCHAR(120),
    `success` BOOLEAN NOT NULL,
    `reason` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_login_user_time` ON `login_logs` (`user_id`, `created_at`);

CREATE TABLE `chat_consultations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `case_no` VARCHAR(32) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(120),
    `status` ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    `handoff_type` ENUM('NONE', 'EMAIL') DEFAULT 'NONE',
    `handoff_at` DATETIME NULL,
    `handoff_reason` VARCHAR(80),
    `opened_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `closed_at` DATETIME NULL,
    `last_message_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_chat_user` ON `chat_consultations` (`user_id`);

CREATE TABLE `chat_messages` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `consultation_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `content` TEXT,
    `sender` ENUM('USER', 'AI', 'SYSTEM') NOT NULL,
    `type` ENUM(
        'TEXT',
        'IMAGE',
        'FILE',
        'SYSTEM'
    ) DEFAULT 'TEXT',
    `metadata` JSON,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_message_consultation` ON `chat_messages` (`consultation_id`);

CREATE TABLE `chat_attachments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `message_id` BIGINT NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(120) NOT NULL,
    `file_size` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE `socket_connections` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `socket_id` VARCHAR(128) NOT NULL,
    `is_online` BOOLEAN DEFAULT TRUE,
    `connected_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `disconnected_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX `idx_socket_user` ON `socket_connections` (`user_id`);

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
    `tag_page` VARCHAR(10) NOT NULL,
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
    `user_id_fk` BIGINT NOT NULL,
    `prod_id_fk` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '用戶收藏商品清單';

-- 寵物：單選資料存於 pets；多選資料存於 pet_selected_options。
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
    `user_id_fk` BIGINT NOT NULL,
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

-- 健康情況選項對應商品特殊標籤，供 AI 導購先篩選候選品項。
CREATE TABLE `pet_health_product_tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `health_option_id_fk` INT NOT NULL,
    `product_special_tag_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '寵物健康情況對應商品特殊標籤';

CREATE TABLE `pet_ai_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id_fk` BIGINT NOT NULL,
    `pet_id_fk` INT NOT NULL,
    `entry_source` VARCHAR(50) NOT NULL DEFAULT 'pet_dashboard',
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `recommended_product_ids` VARCHAR(255),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '寵物 AI 導購問答紀錄';

CREATE TABLE `cart_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id_fk` BIGINT NOT NULL,
    `sku_id_fk` INT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `is_selected` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '購物車列表';

CREATE TABLE `coupons` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(50) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `discount_type` ENUM('percent', 'fixed') NOT NULL,
    `discount_value` INT NOT NULL DEFAULT 0,
    `min_amount` INT NOT NULL DEFAULT 0,
    `start_at` DATETIME NULL,
    `end_at` DATETIME NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '優惠券';

CREATE TABLE `orders` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(30) NOT NULL,
    `user_id_fk` BIGINT NOT NULL,
    `order_status` TINYINT NOT NULL DEFAULT 1 COMMENT '1=處理中,2=已完成,3=已取消,4=退款中,5=退貨中',
    `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=未付款,1=付款中,2=已付款,3=付款失敗,4=付款逾期,5=退款中,6=已退款',
    `shipping_status` TINYINT NOT NULL DEFAULT 1 COMMENT '0=無需配送,1=待出貨,2=備貨中,3=已出貨,4=運送中,5=已送達,6=已取貨,7=退貨中,8=已退回',
    `items_amount` INT NOT NULL DEFAULT 0,
    `shipping_fee` INT NOT NULL DEFAULT 0,
    `coupon_id_fk` INT NULL,
    `coupon_code` VARCHAR(30) NULL,
    `coupon_discount` INT NOT NULL DEFAULT 0,
    `final_amount` INT NOT NULL DEFAULT 0,
    `payment_method` VARCHAR(20) NOT NULL COMMENT 'credit / atm',
    `paid_at` DATETIME NULL,
    `cancelled_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `invoice_type` VARCHAR(20) NULL,
    `carrier_no` VARCHAR(50) NULL,
    `tax_id` VARCHAR(10) NULL,
    `tax_title` VARCHAR(100) NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '訂單主表';

CREATE TABLE `order_shipping_infos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id_fk` INT NOT NULL,
    `receiver_name` VARCHAR(50) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `shipping_method` VARCHAR(20) NOT NULL,
    `receiver_address` VARCHAR(255) NULL,
    `store_name` VARCHAR(100) NULL,
    `store_code` VARCHAR(30) NULL,
    `tracking_no` VARCHAR(50) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '收件資訊';

CREATE TABLE `order_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id_fk` INT NOT NULL,
    `sku_id_fk` INT NOT NULL,
    `product_name` VARCHAR(100) NOT NULL,
    `sku_name` VARCHAR(100) NULL,
    `product_image` VARCHAR(255) NULL,
    `price` INT NOT NULL DEFAULT 0,
    `quantity` INT NOT NULL DEFAULT 1,
    `subtotal` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '訂單明細';

CREATE TABLE `order_status_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id_fk` INT NOT NULL,
    `status_type` ENUM(
        'order',
        'payment',
        'shipping'
    ) NOT NULL,
    `status_value` TINYINT NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '訂單狀態歷程';

CREATE TABLE `ecpay_payments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `order_id_fk` INT NOT NULL,
    `provider` VARCHAR(20) NOT NULL DEFAULT 'ecpay',
    `payment_method` VARCHAR(20) NOT NULL COMMENT 'credit / atm',
    `merchant_trade_no` VARCHAR(50) NOT NULL,
    `trade_no` VARCHAR(50) NULL,
    `amount` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending / paid / failed / expired / cancelled',
    `bank_code` VARCHAR(10) NULL,
    `v_account` VARCHAR(30) NULL,
    `expire_date` DATETIME NULL,
    `rtn_code` VARCHAR(20) NULL,
    `rtn_msg` VARCHAR(255) NULL,
    `payment_type` VARCHAR(50) NULL,
    `trade_date` DATETIME NULL,
    `raw_result` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '綠界付款紀錄';

-- 2. UNIQUE KEY
ALTER TABLE `users`
ADD CONSTRAINT `uq_users_user_no` UNIQUE (`user_no`);

ALTER TABLE `users` ADD CONSTRAINT `uq_users_email` UNIQUE (`email`);

ALTER TABLE `user_oauth_accounts`
ADD CONSTRAINT `uq_provider_user` UNIQUE (
    `provider`,
    `provider_user_id`
);

ALTER TABLE `sessions`
ADD CONSTRAINT `uq_sessions_refresh_token_hash` UNIQUE (`refresh_token_hash`);

ALTER TABLE `chat_consultations`
ADD CONSTRAINT `uq_chat_consultations_case_no` UNIQUE (`case_no`);

ALTER TABLE `socket_connections`
ADD CONSTRAINT `uq_socket_connections_socket_id` UNIQUE (`socket_id`);

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
ADD CONSTRAINT `uq_pet_tag_slug` UNIQUE (`tag_slug`),
ADD CONSTRAINT `uq_pet_tag_page` UNIQUE (`tag_page`);

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
ADD CONSTRAINT `uq_user_favorites_user_product` UNIQUE (`user_id_fk`, `prod_id_fk`);

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

ALTER TABLE `pet_health_product_tags`
ADD CONSTRAINT `uq_pet_health_product_tag` UNIQUE (
    `health_option_id_fk`,
    `product_special_tag_id_fk`
);

ALTER TABLE `cart_items`
ADD CONSTRAINT `uq_cart_items_user_sku` UNIQUE (`user_id_fk`, `sku_id_fk`);

ALTER TABLE `coupons`
ADD CONSTRAINT `uq_coupons_code` UNIQUE (`code`);

ALTER TABLE `orders`
ADD CONSTRAINT `uq_orders_order_no` UNIQUE (`order_no`);

ALTER TABLE `order_shipping_infos`
ADD CONSTRAINT `uq_order_shipping_infos_order` UNIQUE (`order_id_fk`);

ALTER TABLE `ecpay_payments`
ADD CONSTRAINT `uq_ecpay_payments_merchant_trade_no` UNIQUE (`merchant_trade_no`),
ADD CONSTRAINT `uq_ecpay_payments_trade_no` UNIQUE (`trade_no`);

-- 3. FOREIGN KEY
ALTER TABLE `user_oauth_accounts`
ADD CONSTRAINT `fk_user_oauth_accounts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `sessions`
ADD CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `otp_codes`
ADD CONSTRAINT `fk_otp_codes_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `login_logs`
ADD CONSTRAINT `fk_login_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `chat_consultations`
ADD CONSTRAINT `fk_chat_consultations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `chat_messages`
ADD CONSTRAINT `fk_chat_messages_consultation_id` FOREIGN KEY (`consultation_id`) REFERENCES `chat_consultations` (`id`) ON DELETE CASCADE;

ALTER TABLE `chat_messages`
ADD CONSTRAINT `fk_chat_messages_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `chat_attachments`
ADD CONSTRAINT `fk_chat_attachments_message_id` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE;

ALTER TABLE `socket_connections`
ADD CONSTRAINT `fk_socket_connections_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
ADD CONSTRAINT `fk_user_favorites_user` FOREIGN KEY (`user_id_fk`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_user_favorites_product` FOREIGN KEY (`prod_id_fk`) REFERENCES `products` (`id`);

ALTER TABLE `pet_attr_details`
ADD CONSTRAINT `fk_pet_attr_details_attribute` FOREIGN KEY (`pet_attr_id_fk`) REFERENCES `pet_attributes` (`id`);

ALTER TABLE `pets`
ADD CONSTRAINT `fk_pets_user` FOREIGN KEY (`user_id_fk`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_pets_species_option` FOREIGN KEY (`species_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_gender_option` FOREIGN KEY (`gender_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_neutered_option` FOREIGN KEY (`neutered_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_activity_level_option` FOREIGN KEY (`activity_level_option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_selected_options`
ADD CONSTRAINT `fk_pet_selected_options_pet` FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_group` FOREIGN KEY (`option_group_id_fk`) REFERENCES `pet_attributes` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_option` FOREIGN KEY (`option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_health_product_tags`
ADD CONSTRAINT `fk_pet_health_product_tags_health_option` FOREIGN KEY (`health_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pet_health_product_tags_product_tag` FOREIGN KEY (`product_special_tag_id_fk`) REFERENCES `product_special_tags` (`id`);

ALTER TABLE `pet_ai_logs`
ADD CONSTRAINT `fk_pet_ai_logs_user` FOREIGN KEY (`user_id_fk`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_pet_ai_logs_pet` FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`);

ALTER TABLE `cart_items`
ADD CONSTRAINT `fk_cart_items_user` FOREIGN KEY (`user_id_fk`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_cart_items_sku` FOREIGN KEY (`sku_id_fk`) REFERENCES `items` (`id`);

ALTER TABLE `orders`
ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id_fk`) REFERENCES `users` (`id`),
ADD CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id_fk`) REFERENCES `coupons` (`id`);

ALTER TABLE `order_shipping_infos`
ADD CONSTRAINT `fk_order_shipping_infos_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);

ALTER TABLE `order_items`
ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`),
ADD CONSTRAINT `fk_order_items_sku` FOREIGN KEY (`sku_id_fk`) REFERENCES `items` (`id`);

ALTER TABLE `order_status_logs`
ADD CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);

ALTER TABLE `ecpay_payments`
ADD CONSTRAINT `fk_ecpay_payments_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);