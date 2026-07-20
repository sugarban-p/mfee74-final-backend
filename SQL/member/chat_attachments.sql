-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2026 年 07 月 14 日 09:49
-- 伺服器版本： 8.0.45
-- PHP 版本： 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `mofu_data`
--

-- --------------------------------------------------------

--
-- 資料表結構 `chat_attachments`
--

CREATE TABLE `chat_attachments` (
  `id` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `chat_attachments`
--

INSERT INTO `chat_attachments` (`id`, `message_id`, `file_url`, `file_name`, `mime_type`, `file_size`, `created_at`) VALUES
(1, 1, 'https://storage.mofu.com/chat/pet/cat_001.jpg', 'cat_shedding_problem.jpg', 'image/jpeg', 245760, '2026-07-10 21:42:10'),
(2, 3, 'https://storage.mofu.com/chat/pet/cat_002.jpg', 'cat_food_photo.jpg', 'image/jpeg', 183420, '2026-07-08 20:18:10'),
(3, 5, 'https://storage.mofu.com/chat/pet/dog_001.jpg', 'dog_joint_health.jpg', 'image/jpeg', 298340, '2026-07-06 22:25:10'),
(4, 7, 'https://storage.mofu.com/chat/product/product_001.jpg', 'ingredient_label.jpg', 'image/jpeg', 152800, '2026-07-04 16:50:10'),
(5, 8, 'https://storage.mofu.com/chat/pet/dog_skin.jpg', 'dog_skin_condition.jpg', 'image/jpeg', 342500, '2026-07-01 09:35:10'),
(6, 9, 'https://storage.mofu.com/chat/product/cat_litter.jpg', 'cat_litter_compare.jpg', 'image/jpeg', 221600, '2026-07-10 10:10:10'),
(7, 11, 'https://storage.mofu.com/chat/product/cat_food.jpg', 'cat_wet_food.jpg', 'image/jpeg', 190500, '2026-07-10 14:45:10'),
(8, 13, 'https://storage.mofu.com/chat/product/shampoo.jpg', 'pet_shampoo.jpg', 'image/jpeg', 175300, '2026-07-08 13:35:10'),
(9, 15, 'https://storage.mofu.com/chat/product/snack.jpg', 'pet_snack.jpg', 'image/jpeg', 164200, '2026-07-06 18:50:10'),
(10, 16, 'https://storage.mofu.com/chat/pet/old_dog.jpg', 'old_dog_health.jpg', 'image/jpeg', 301400, '2026-07-10 08:10:10'),
(11, 17, 'https://storage.mofu.com/chat/product/water_fountain.jpg', 'cat_water_fountain.jpg', 'image/jpeg', 278900, '2026-07-03 21:25:10'),
(12, 18, 'https://storage.mofu.com/chat/pet/allergy.jpg', 'pet_allergy_photo.jpg', 'image/jpeg', 356700, '2026-07-02 11:50:10'),
(13, 20, 'https://storage.mofu.com/chat/order/order_photo.jpg', 'order_information.jpg', 'image/jpeg', 125400, '2026-07-08 19:50:10'),
(14, 22, 'https://storage.mofu.com/chat/product/toy.jpg', 'dog_toy_material.jpg', 'image/jpeg', 210300, '2026-07-09 17:35:10'),
(15, 23, 'https://storage.mofu.com/chat/order/return.jpg', 'return_product.jpg', 'image/jpeg', 189700, '2026-07-02 15:50:10'),
(16, 24, 'https://storage.mofu.com/chat/product/fresh_food.jpg', 'dog_fresh_food.jpg', 'image/jpeg', 245900, '2026-07-10 09:35:10'),
(17, 25, 'https://storage.mofu.com/chat/product/supplement.jpg', 'cat_supplement.jpg', 'image/jpeg', 230600, '2026-07-10 20:25:10'),
(18, 26, 'https://storage.mofu.com/chat/security/login_warning.jpg', 'login_warning.jpg', 'image/jpeg', 102400, '2026-07-06 10:20:10'),
(19, 27, 'https://storage.mofu.com/chat/product/pet_bed.jpg', 'pet_bed_size.jpg', 'image/jpeg', 220800, '2026-07-10 16:45:10'),
(20, 28, 'https://storage.mofu.com/chat/product/outdoor.jpg', 'dog_outdoor_goods.jpg', 'image/jpeg', 198500, '2026-07-09 20:35:10'),
(21, 29, 'https://storage.mofu.com/chat/promotion/event.jpg', 'member_discount.jpg', 'image/jpeg', 145600, '2026-07-10 18:55:10'),
(22, 30, 'https://storage.mofu.com/chat/coupon/coupon.jpg', 'coupon_problem.jpg', 'image/jpeg', 132400, '2026-07-10 22:20:10');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `chat_attachments`
--
ALTER TABLE `chat_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `chat_attachments`
--
ALTER TABLE `chat_attachments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `chat_attachments`
--
ALTER TABLE `chat_attachments`
  ADD CONSTRAINT `chat_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
