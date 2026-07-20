USE `final_team3`;

-- 訂單管理假資料：只新增購物車、優惠券、訂單、收件資訊、訂單明細、狀態紀錄、金流紀錄。
-- 會使用既有 users 與 items 的前幾筆資料作為 FK。

SET @user1 := (SELECT `id` FROM `users` ORDER BY `id` LIMIT 1 OFFSET 0);
SET @user2 := (SELECT `id` FROM `users` ORDER BY `id` LIMIT 1 OFFSET 1);
SET @user3 := (SELECT `id` FROM `users` ORDER BY `id` LIMIT 1 OFFSET 2);

SET @sku1 := (SELECT `id` FROM `items` ORDER BY `id` LIMIT 1 OFFSET 0);
SET @sku2 := (SELECT `id` FROM `items` ORDER BY `id` LIMIT 1 OFFSET 1);
SET @sku3 := (SELECT `id` FROM `items` ORDER BY `id` LIMIT 1 OFFSET 2);
SET @sku4 := (SELECT `id` FROM `items` ORDER BY `id` LIMIT 1 OFFSET 3);
SET @sku5 := (SELECT `id` FROM `items` ORDER BY `id` LIMIT 1 OFFSET 4);

SET @sku1_product := (SELECT `p`.`prod_name` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku1);
SET @sku2_product := (SELECT `p`.`prod_name` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku2);
SET @sku3_product := (SELECT `p`.`prod_name` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku3);
SET @sku4_product := (SELECT `p`.`prod_name` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku4);

SET @sku1_name := (SELECT `item_name` FROM `items` WHERE `id` = @sku1);
SET @sku2_name := (SELECT `item_name` FROM `items` WHERE `id` = @sku2);
SET @sku3_name := (SELECT `item_name` FROM `items` WHERE `id` = @sku3);
SET @sku4_name := (SELECT `item_name` FROM `items` WHERE `id` = @sku4);

SET @sku1_price := (SELECT `p`.`price` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku1);
SET @sku2_price := (SELECT `p`.`price` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku2);
SET @sku3_price := (SELECT `p`.`price` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku3);
SET @sku4_price := (SELECT `p`.`price` FROM `items` AS `i` JOIN `products` AS `p` ON `p`.`id` = `i`.`prod_id_fk` WHERE `i`.`id` = @sku4);

INSERT INTO
  `coupons` (
    `title`,
    `code`,
    `discount_type`,
    `discount_value`,
    `min_amount`,
    `start_at`,
    `end_at`,
    `is_active`
  )
VALUES
  ('新會員折抵 NT$200', 'SAVE200', 'fixed', 200, 1000, '2026-07-01 00:00:00', '2026-12-31 23:59:59', 1),
  ('毛孩日九折優惠', 'PET10', 'percent', 90, 1500, '2026-07-01 00:00:00', '2026-12-31 23:59:59', 1),
  ('全館免運券', 'FREESHIP', 'fixed', 0, 0, '2026-07-01 00:00:00', '2026-12-31 23:59:59', 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `discount_type` = VALUES(`discount_type`),
  `discount_value` = VALUES(`discount_value`),
  `min_amount` = VALUES(`min_amount`),
  `start_at` = VALUES(`start_at`),
  `end_at` = VALUES(`end_at`),
  `is_active` = VALUES(`is_active`);

SET @coupon_save200 := (SELECT `id` FROM `coupons` WHERE `code` = 'SAVE200');
SET @coupon_pet10 := (SELECT `id` FROM `coupons` WHERE `code` = 'PET10');

SET @order1_items_amount := @sku1_price * 2 + @sku2_price;
SET @order2_items_amount := @sku2_price + @sku3_price;
SET @order2_discount := LEAST(200, @order2_items_amount);
SET @order3_items_amount := @sku1_price * 2;
SET @order4_items_amount := @sku1_price * 2 + @sku2_price + @sku3_price;
SET @order4_discount := ROUND(@order4_items_amount * 0.1);
SET @order5_items_amount := @sku4_price;

INSERT INTO
  `cart_items` (`user_id_fk`, `sku_id_fk`, `quantity`, `is_selected`)
VALUES
  (@user1, @sku1, 2, 1),
  (@user1, @sku2, 1, 1),
  (@user1, @sku3, 1, 1),
  (@user2, @sku4, 1, 1),
  (@user2, @sku5, 2, 0)
ON DUPLICATE KEY UPDATE
  `quantity` = VALUES(`quantity`),
  `is_selected` = VALUES(`is_selected`);

DELETE `log`
FROM `order_status_logs` AS `log`
JOIN `orders` AS `o` ON `o`.`id` = `log`.`order_id_fk`
WHERE `o`.`order_no` IN (
  'ORD202607020001',
  'ORD202607010002',
  'ORD202606280003',
  'ORD202606250004',
  'ORD202606200005'
);

DELETE `pay`
FROM `ecpay_payments` AS `pay`
JOIN `orders` AS `o` ON `o`.`id` = `pay`.`order_id_fk`
WHERE `o`.`order_no` IN (
  'ORD202607020001',
  'ORD202607010002',
  'ORD202606280003',
  'ORD202606250004',
  'ORD202606200005'
);

DELETE `ship`
FROM `order_shipping_infos` AS `ship`
JOIN `orders` AS `o` ON `o`.`id` = `ship`.`order_id_fk`
WHERE `o`.`order_no` IN (
  'ORD202607020001',
  'ORD202607010002',
  'ORD202606280003',
  'ORD202606250004',
  'ORD202606200005'
);

DELETE `item`
FROM `order_items` AS `item`
JOIN `orders` AS `o` ON `o`.`id` = `item`.`order_id_fk`
WHERE `o`.`order_no` IN (
  'ORD202607020001',
  'ORD202607010002',
  'ORD202606280003',
  'ORD202606250004',
  'ORD202606200005'
);

DELETE FROM `orders`
WHERE `order_no` IN (
  'ORD202607020001',
  'ORD202607010002',
  'ORD202606280003',
  'ORD202606250004',
  'ORD202606200005'
);

INSERT INTO
  `orders` (
    `order_no`,
    `user_id_fk`,
    `order_status`,
    `payment_status`,
    `shipping_status`,
    `items_amount`,
    `shipping_fee`,
    `coupon_id_fk`,
    `coupon_code`,
    `coupon_discount`,
    `final_amount`,
    `payment_method`,
    `paid_at`,
    `cancelled_at`,
    `completed_at`,
    `invoice_type`,
    `remark`,
    `created_at`
  )
VALUES
  ('ORD202607020001', @user1, 1, 2, 3, @order1_items_amount, 0, NULL, NULL, 0, @order1_items_amount, 'credit', '2026-07-02 15:43:00', NULL, NULL, '個人發票', '請盡快出貨，謝謝。', '2026-07-02 14:35:00'),
  ('ORD202607010002', @user1, 2, 2, 6, @order2_items_amount, 0, @coupon_save200, 'SAVE200', @order2_discount, @order2_items_amount - @order2_discount, 'linepay', '2026-07-01 10:22:00', NULL, '2026-07-03 18:00:00', '個人發票', NULL, '2026-07-01 10:20:00'),
  ('ORD202606280003', @user2, 1, 0, 1, @order3_items_amount, 0, NULL, NULL, 0, @order3_items_amount, 'credit', NULL, NULL, NULL, '個人發票', '付款待確認。', '2026-06-28 09:15:00'),
  ('ORD202606250004', @user2, 3, 6, 8, @order4_items_amount, 0, @coupon_pet10, 'PET10', @order4_discount, @order4_items_amount - @order4_discount, 'credit', '2026-06-25 16:45:00', '2026-06-26 11:20:00', NULL, '個人發票', '會員取消訂單。', '2026-06-25 16:40:00'),
  ('ORD202606200005', @user3, 1, 2, 2, @order5_items_amount, 0, NULL, NULL, 0, @order5_items_amount, 'linepay', '2026-06-20 13:12:00', NULL, NULL, '個人發票', NULL, '2026-06-20 13:10:00');

SET @order1 := (SELECT `id` FROM `orders` WHERE `order_no` = 'ORD202607020001');
SET @order2 := (SELECT `id` FROM `orders` WHERE `order_no` = 'ORD202607010002');
SET @order3 := (SELECT `id` FROM `orders` WHERE `order_no` = 'ORD202606280003');
SET @order4 := (SELECT `id` FROM `orders` WHERE `order_no` = 'ORD202606250004');
SET @order5 := (SELECT `id` FROM `orders` WHERE `order_no` = 'ORD202606200005');

INSERT INTO
  `order_shipping_infos` (
    `order_id_fk`,
    `receiver_name`,
    `receiver_phone`,
    `shipping_method`,
    `receiver_address`,
    `tracking_no`
  )
VALUES
  (@order1, '林小美', '0912-345-678', '宅配', '台北市信義區信義路五段 7 號 10 樓', '9261290100830026001'),
  (@order2, '林小美', '0912-345-678', '宅配', '台北市信義區信義路五段 7 號 10 樓', '9261290100830026002'),
  (@order3, '王毛毛', '0922-111-222', '宅配', '新北市板橋區文化路一段 100 號', NULL),
  (@order4, '王毛毛', '0922-111-222', '宅配', '新北市板橋區文化路一段 100 號', '9261290100830026004'),
  (@order5, '陳可可', '0933-333-444', '宅配', '台中市西屯區台灣大道三段 88 號', NULL);

INSERT INTO
  `order_items` (
    `order_id_fk`,
    `sku_id_fk`,
    `product_name`,
    `sku_name`,
    `product_image`,
    `price`,
    `quantity`,
    `subtotal`
  )
VALUES
  (@order1, @sku1, @sku1_product, @sku1_name, NULL, @sku1_price, 2, @sku1_price * 2),
  (@order1, @sku2, @sku2_product, @sku2_name, NULL, @sku2_price, 1, @sku2_price),
  (@order2, @sku2, @sku2_product, @sku2_name, NULL, @sku2_price, 1, @sku2_price),
  (@order2, @sku3, @sku3_product, @sku3_name, NULL, @sku3_price, 1, @sku3_price),
  (@order3, @sku1, @sku1_product, @sku1_name, NULL, @sku1_price, 2, @sku1_price * 2),
  (@order4, @sku1, @sku1_product, @sku1_name, NULL, @sku1_price, 2, @sku1_price * 2),
  (@order4, @sku2, @sku2_product, @sku2_name, NULL, @sku2_price, 1, @sku2_price),
  (@order4, @sku3, @sku3_product, @sku3_name, NULL, @sku3_price, 1, @sku3_price),
  (@order5, @sku4, @sku4_product, @sku4_name, NULL, @sku4_price, 1, @sku4_price);

INSERT INTO
  `order_status_logs` (`order_id_fk`, `status_type`, `status_value`, `note`, `created_at`)
VALUES
  (@order1, 'order', 1, '訂單成立', '2026-07-02 14:35:00'),
  (@order1, 'payment', 2, '信用卡付款完成', '2026-07-02 15:43:00'),
  (@order1, 'shipping', 3, '商品已出貨', '2026-07-03 09:20:00'),
  (@order2, 'order', 2, '訂單完成', '2026-07-03 18:00:00'),
  (@order2, 'payment', 2, 'LINE Pay 付款完成', '2026-07-01 10:22:00'),
  (@order3, 'payment', 0, '等待付款', '2026-06-28 09:15:00'),
  (@order4, 'order', 3, '訂單取消', '2026-06-26 11:20:00'),
  (@order4, 'payment', 6, '已退款', '2026-06-26 12:00:00'),
  (@order5, 'shipping', 2, '備貨中', '2026-06-21 09:00:00');

INSERT INTO
  `ecpay_payments` (
    `order_id_fk`,
    `provider`,
    `payment_method`,
    `merchant_trade_no`,
    `trade_no`,
    `amount`,
    `status`,
    `rtn_code`,
    `rtn_msg`,
    `payment_type`,
    `trade_date`,
    `raw_result`
  )
VALUES
  (@order1, 'ecpay', 'credit', 'ORD202607020001', '2026070215430001234', @order1_items_amount, 'paid', '1', '付款成功', 'Credit_CreditCard', '2026-07-02 15:43:00', JSON_OBJECT('mock', true)),
  (@order3, 'ecpay', 'credit', 'ORD202606280003', NULL, @order3_items_amount, 'pending', NULL, '等待付款', NULL, NULL, JSON_OBJECT('mock', true)),
  (@order4, 'ecpay', 'credit', 'ORD202606250004', '2026062516450001234', @order4_items_amount - @order4_discount, 'cancelled', '1', '已退款', 'Credit_CreditCard', '2026-06-25 16:45:00', JSON_OBJECT('mock', true)),
  (@order5, 'linepay', 'linepay', 'ORD202606200005', 'LINE202606201312001234', @order5_items_amount, 'paid', '0000', '付款成功', 'LINE Pay', '2026-06-20 13:12:00', JSON_OBJECT('mock', true));
