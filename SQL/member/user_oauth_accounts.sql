-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2026 年 07 月 14 日 09:50
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
-- 資料表結構 `user_oauth_accounts`
--

CREATE TABLE `user_oauth_accounts` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `provider` enum('GOOGLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `user_oauth_accounts`
--

INSERT INTO `user_oauth_accounts` (`id`, `user_id`, `provider`, `provider_user_id`, `provider_email`, `provider_name`, `provider_avatar`, `created_at`, `updated_at`) VALUES
(1, 1, 'GOOGLE', 'google_109284756001', 'yuki.chen@gmail.com', '陳優希', 'https://lh3.googleusercontent.com/avatar001', '2026-06-10 09:16:00', '2026-07-12 18:09:32'),
(2, 2, 'GOOGLE', 'google_109284756002', 'amy.wang@gmail.com', '王雅婷', 'https://lh3.googleusercontent.com/avatar002', '2026-06-11 13:22:00', '2026-07-12 18:09:32'),
(3, 3, 'GOOGLE', 'google_109284756003', 'kevin.lin@gmail.com', '林承翰', 'https://lh3.googleusercontent.com/avatar003', '2026-06-12 10:08:00', '2026-07-12 18:09:32'),
(4, 5, 'GOOGLE', 'google_109284756005', 'jacky.lee@gmail.com', '李冠廷', 'https://lh3.googleusercontent.com/avatar005', '2026-06-14 11:50:00', '2026-07-12 18:09:32'),
(5, 6, 'GOOGLE', 'google_109284756006', 'sophia.tsai@gmail.com', '蔡佳穎', 'https://lh3.googleusercontent.com/avatar006', '2026-06-15 08:35:00', '2026-07-12 18:09:32'),
(6, 7, 'GOOGLE', 'google_109284756007', 'eric.wu@gmail.com', '吳俊賢', 'https://lh3.googleusercontent.com/avatar007', '2026-06-16 14:15:00', '2026-07-12 18:09:32'),
(7, 8, 'GOOGLE', 'google_109284756008', 'lisa.chang@gmail.com', '張雅雯', 'https://lh3.googleusercontent.com/avatar008', '2026-06-17 12:15:00', '2026-07-12 18:09:32'),
(8, 10, 'GOOGLE', 'google_109284756010', 'vivian.liu@gmail.com', '劉薇安', 'https://lh3.googleusercontent.com/avatar010', '2026-06-19 16:25:00', '2026-07-12 18:09:32'),
(9, 11, 'GOOGLE', 'google_109284756011', 'cindy.hsu@gmail.com', '許欣怡', 'https://lh3.googleusercontent.com/avatar011', '2026-06-20 10:25:00', '2026-07-12 18:09:32'),
(10, 13, 'GOOGLE', 'google_109284756013', 'grace.yeh@gmail.com', '葉佳蓉', 'https://lh3.googleusercontent.com/avatar013', '2026-06-22 09:35:00', '2026-07-12 18:09:32'),
(11, 15, 'GOOGLE', 'google_109284756015', 'iris.cheng@gmail.com', '鄭伊婷', 'https://lh3.googleusercontent.com/avatar015', '2026-06-24 12:25:00', '2026-07-12 18:09:32'),
(12, 17, 'GOOGLE', 'google_109284756017', 'zoe.luo@gmail.com', '羅子晴', 'https://lh3.googleusercontent.com/avatar017', '2026-06-26 10:45:00', '2026-07-12 18:09:32'),
(13, 19, 'GOOGLE', 'google_109284756019', 'kelly.wu@gmail.com', '吳佩珊', 'https://lh3.googleusercontent.com/avatar019', '2026-06-28 16:25:00', '2026-07-12 18:09:32'),
(14, 21, 'GOOGLE', 'google_109284756021', 'mina.chang@gmail.com', '張心怡', 'https://lh3.googleusercontent.com/avatar021', '2026-06-30 09:15:00', '2026-07-12 18:09:32'),
(15, 22, 'GOOGLE', 'google_109284756022', 'steven.lin@gmail.com', '林威廷', 'https://lh3.googleusercontent.com/avatar022', '2026-07-01 13:15:00', '2026-07-12 18:09:32'),
(16, 25, 'GOOGLE', 'google_109284756025', 'jenny.liu@gmail.com', '劉佳雯', 'https://lh3.googleusercontent.com/avatar025', '2026-07-04 14:35:00', '2026-07-12 18:09:32'),
(17, 27, 'GOOGLE', 'google_109284756027', 'vivian.chen@gmail.com', '陳薇安', 'https://lh3.googleusercontent.com/avatar027', '2026-07-06 09:35:00', '2026-07-12 18:09:32'),
(18, 30, 'GOOGLE', 'google_109284756030', 'ryan.lee@gmail.com', '李昱辰', 'https://lh3.googleusercontent.com/avatar030', '2026-07-09 10:15:00', '2026-07-12 18:09:32');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `user_oauth_accounts`
--
ALTER TABLE `user_oauth_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_provider_user` (`provider`,`provider_user_id`),
  ADD KEY `idx_oauth_user` (`user_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_oauth_accounts`
--
ALTER TABLE `user_oauth_accounts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `user_oauth_accounts`
--
ALTER TABLE `user_oauth_accounts`
  ADD CONSTRAINT `user_oauth_accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
