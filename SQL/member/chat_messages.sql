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
-- 資料表結構 `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL,
  `consultation_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `sender` enum('USER','AI','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('TEXT','IMAGE','FILE','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT 'TEXT',
  `metadata` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `consultation_id`, `user_id`, `content`, `sender`, `type`, `metadata`, `created_at`) VALUES
(1, 1, 1, '我的貓咪最近掉毛很嚴重，有推薦適合的保健食品嗎？', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"question\"}', '2026-07-10 21:42:00'),
(2, 2, 2, '我的幼犬剛滿半歲，想找天然無添加的零食。', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"question\"}', '2026-07-09 18:25:00'),
(3, 3, 3, '貓咪腸胃比較敏感，請問有推薦的飼料嗎？', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"question\"}', '2026-07-08 20:18:00'),
(4, 4, 4, '請問訂單大概多久可以收到？', 'USER', 'TEXT', '{\"type\": \"shipping\"}', '2026-07-07 12:45:00'),
(5, 5, 5, '狗狗年紀大了，需要補充關節保健嗎？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"health\"}', '2026-07-06 22:25:00'),
(6, 6, 6, '幼貓可以吃成貓的營養補充品嗎？', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"nutrition\"}', '2026-07-05 19:35:00'),
(7, 7, 7, '想了解商品是否有提供完整成分表。', 'USER', 'TEXT', '{\"type\": \"ingredient\"}', '2026-07-04 16:50:00'),
(8, 8, 8, '我的狗狗皮膚容易敏感，有適合的洗護用品嗎？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"care\"}', '2026-07-01 09:35:00'),
(9, 9, 9, '貓砂種類很多，不知道哪一款比較適合新手飼主。', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"product_compare\"}', '2026-07-10 10:10:00'),
(10, 10, 10, '我想查詢目前訂單配送進度。', 'USER', 'TEXT', '{\"type\": \"order\"}', '2026-07-10 08:50:00'),
(11, 11, 11, '想請問適合成貓每天食用的主食罐推薦。', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"food\"}', '2026-07-10 14:45:00'),
(12, 12, 12, '我忘記登入密碼，需要協助重設帳號。', 'USER', 'TEXT', '{\"type\": \"account\"}', '2026-07-09 10:05:00'),
(13, 13, 13, '請推薦天然成分的寵物洗毛精。', 'USER', 'TEXT', '{\"type\": \"care\"}', '2026-07-08 13:35:00'),
(14, 14, 14, '狗狗平常需要補充哪些營養品？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"nutrition\"}', '2026-07-09 10:25:00'),
(15, 15, 15, '請問零食是否適合每天餵食？', 'USER', 'TEXT', '{\"type\": \"snack\"}', '2026-07-06 18:50:00'),
(16, 16, 16, '老犬最近活動量下降，有推薦關節保健商品嗎？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"health\"}', '2026-07-10 08:10:00'),
(17, 17, 17, '想購買適合室內貓使用的飲水設備。', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"product\"}', '2026-07-03 21:25:00'),
(18, 18, 18, '我的寵物有過敏狀況，可以推薦相關商品嗎？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"health\"}', '2026-07-02 11:50:00'),
(19, 19, 19, '天然食品開封後應該如何保存？', 'USER', 'TEXT', '{\"type\": \"storage\"}', '2026-07-09 22:25:00'),
(20, 20, 20, '訂單下錯商品，可以協助修改嗎？', 'USER', 'TEXT', '{\"type\": \"order_change\"}', '2026-07-08 19:50:00'),
(21, 21, 21, '幼貓剛開始吃乾糧，有推薦品牌嗎？', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"food\"}', '2026-07-10 12:35:00'),
(22, 22, 22, '狗狗玩具材質是否安全無毒？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"product\"}', '2026-07-09 17:35:00'),
(23, 23, 23, '收到商品後想申請退換貨。', 'USER', 'TEXT', '{\"type\": \"return\"}', '2026-07-02 15:50:00'),
(24, 24, 24, '想找適合小型犬的天然鮮食。', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"food\"}', '2026-07-10 09:35:00'),
(25, 25, 25, '貓咪保健食品有哪些差異？', 'USER', 'TEXT', '{\"pet\": \"cat\", \"type\": \"compare\"}', '2026-07-10 20:25:00'),
(26, 26, 26, '帳號出現異常登入通知，想確認安全問題。', 'USER', 'TEXT', '{\"type\": \"security\"}', '2026-07-06 10:20:00'),
(27, 27, 27, '寵物床墊尺寸如何選擇？', 'USER', 'TEXT', '{\"type\": \"product\"}', '2026-07-10 16:45:00'),
(28, 28, 28, '想購買狗狗外出用品，有推薦嗎？', 'USER', 'TEXT', '{\"pet\": \"dog\", \"type\": \"product\"}', '2026-07-09 20:35:00'),
(29, 29, 29, '目前有哪些會員優惠活動？', 'USER', 'TEXT', '{\"type\": \"promotion\"}', '2026-07-10 18:55:00'),
(30, 30, 30, '優惠券要如何使用？', 'USER', 'TEXT', '{\"type\": \"coupon\"}', '2026-07-10 22:20:00'),
(31, 1, NULL, '您好，針對貓咪掉毛問題，可以考慮含有 Omega-3、魚油與營養補充配方的保健食品。建議依照貓咪年齡與體重選擇適合份量。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 21:43:00'),
(32, 2, NULL, '幼犬建議選擇低添加、天然原料製作的零食，並控制每日餵食比例避免影響正餐。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 18:26:00'),
(33, 3, NULL, '敏感腸胃貓咪可以選擇容易消化、蛋白質來源單純的配方食品。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-08 20:19:00'),
(34, 4, NULL, '一般訂單約於付款完成後 2～5 個工作天送達，實際時間依物流狀況為準。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-07 12:46:00'),
(35, 5, NULL, '年長犬隻可以補充葡萄糖胺、軟骨素等關節保健成分，建議依照活動量調整。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-06 22:26:00'),
(36, 6, NULL, '幼貓成長階段需要不同營養比例，建議選擇符合幼貓需求的專用產品。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-05 19:36:00'),
(37, 7, NULL, '所有 MOFU 商品皆提供完整成分資訊，可於商品詳細頁查看。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-04 16:51:00'),
(38, 8, NULL, '狗狗皮膚敏感時，建議選擇溫和低刺激的洗護用品，避免含有過多人工香料成分。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-01 09:36:00'),
(39, 9, NULL, '貓砂選擇可以依照除臭能力、粉塵量與貓咪接受程度挑選，初次使用建議少量測試。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 10:11:00'),
(40, 10, NULL, '您好，已收到您的配送查詢需求，建議至會員中心查看最新物流狀態。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 08:51:00'),
(41, 11, NULL, '成貓主食罐可依照蛋白質來源與每日熱量需求挑選，建議搭配乾糧增加飲食豐富度。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 14:46:00'),
(42, 12, NULL, '我們可以協助您透過 Email 驗證流程重新設定密碼，請確認註冊信箱是否可正常收信。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 10:06:00'),
(43, 13, NULL, '天然洗護用品建議選擇適合寵物肌膚酸鹼值的配方，避免過度清潔造成刺激。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-08 13:36:00'),
(44, 14, NULL, '狗狗日常營養可以依照年齡、體型與活動量補充，例如關節、皮毛或腸胃保健。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 10:26:00'),
(45, 15, NULL, '零食建議作為獎勵使用，每日攝取量不要超過總熱量比例。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-06 18:51:00'),
(46, 16, NULL, '老犬關節保健可以選擇含葡萄糖胺、軟骨素或魚油成分的產品。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 08:11:00'),
(47, 17, NULL, '室內貓飲水設備建議選擇容易清潔、低噪音並提供循環過濾功能的款式。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-03 21:26:00'),
(48, 18, NULL, '若寵物有過敏問題，建議先確認過敏來源，商品選擇以低敏與單純成分為主。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-02 11:51:00'),
(49, 19, NULL, '天然食品開封後建議密封保存，並依照商品標示期限內使用完畢。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 22:26:00'),
(50, 20, NULL, '訂單修改需確認目前處理狀態，若尚未出貨可協助調整。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-08 19:51:00'),
(51, 21, NULL, '幼貓建議選擇高營養密度、符合成長階段需求的幼貓專用食品。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 12:36:00'),
(52, 22, NULL, 'MOFU 商品皆會標示材質資訊，建議選擇無毒、安全且適合寵物使用的產品。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 17:36:00'),
(53, 23, NULL, '退換貨需要確認商品狀態與購買時間，客服會協助後續流程。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-02 15:51:00'),
(54, 24, NULL, '小型犬鮮食建議注意蛋白質比例與每日餵食量，可依體重調整。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 09:36:00'),
(55, 25, NULL, '保健食品差異主要在成分比例與功能方向，例如皮毛、腸胃或關節保養。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 20:26:00'),
(56, 26, NULL, '已收到您的安全問題，建議立即確認登入紀錄，若有異常請修改密碼。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-06 10:21:00'),
(57, 27, NULL, '寵物床墊尺寸建議依照寵物體型與睡姿選擇，確保足夠活動空間。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 16:46:00'),
(58, 28, NULL, '外出用品可以依照使用情境選擇，例如胸背帶、外出包與飲水設備。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-09 20:36:00'),
(59, 29, NULL, '會員優惠活動會依照活動期間更新，可至會員中心查看最新優惠。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 18:56:00'),
(60, 30, NULL, '優惠券可以於結帳頁面選擇符合條件的優惠券套用。', 'AI', 'TEXT', '{\"type\": \"ai_response\", \"model\": \"gpt\"}', '2026-07-10 22:21:00');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_message_consultation` (`consultation_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`consultation_id`) REFERENCES `chat_consultations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
