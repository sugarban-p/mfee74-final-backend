-- 本檔會重建 final_team3 資料庫，匯入前請確認資料可以被刪除。
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

CREATE TABLE `cart_items` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
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
    `member_id_fk` INT NOT NULL,
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
    `status_type` ENUM('order', 'payment', 'shipping') NOT NULL,
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

ALTER TABLE `cart_items`
ADD CONSTRAINT `uq_cart_items_member_sku` UNIQUE (`member_id_fk`, `sku_id_fk`);

ALTER TABLE `coupons`
ADD CONSTRAINT `uq_coupons_code` UNIQUE (`code`);

ALTER TABLE `orders`
ADD CONSTRAINT `uq_orders_order_no` UNIQUE (`order_no`);

ALTER TABLE `order_shipping_infos`
ADD CONSTRAINT `uq_order_shipping_infos_order` UNIQUE (`order_id_fk`);

ALTER TABLE `ecpay_payments`
ADD CONSTRAINT `uq_ecpay_payments_merchant_trade_no` UNIQUE (`merchant_trade_no`),
ADD CONSTRAINT `uq_ecpay_payments_trade_no` UNIQUE (`trade_no`);

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

ALTER TABLE `cart_items`
ADD CONSTRAINT `fk_cart_items_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_cart_items_sku` FOREIGN KEY (`sku_id_fk`) REFERENCES `product_items` (`id`);

ALTER TABLE `orders`
ADD CONSTRAINT `fk_orders_member` FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id_fk`) REFERENCES `coupons` (`id`);

ALTER TABLE `order_shipping_infos`
ADD CONSTRAINT `fk_order_shipping_infos_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);

ALTER TABLE `order_items`
ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`),
ADD CONSTRAINT `fk_order_items_sku` FOREIGN KEY (`sku_id_fk`) REFERENCES `product_items` (`id`);

ALTER TABLE `order_status_logs`
ADD CONSTRAINT `fk_order_status_logs_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);

ALTER TABLE `ecpay_payments`
ADD CONSTRAINT `fk_ecpay_payments_order` FOREIGN KEY (`order_id_fk`) REFERENCES `orders` (`id`);