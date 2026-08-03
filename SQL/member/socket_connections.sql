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
-- 資料表結構 `socket_connections`
--

CREATE TABLE `socket_connections` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `socket_id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_online` tinyint(1) DEFAULT '1',
  `connected_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `disconnected_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `socket_connections`
--

INSERT INTO `socket_connections` (`id`, `user_id`, `socket_id`, `is_online`, `connected_at`, `disconnected_at`, `created_at`) VALUES
(1, 1, 'socket_mofu_user_001_a8f31', 1, '2026-07-10 21:40:00', NULL, '2026-07-10 21:40:00'),
(2, 2, 'socket_mofu_user_002_b7c42', 0, '2026-07-09 18:20:00', '2026-07-09 18:50:00', '2026-07-09 18:20:00'),
(3, 3, 'socket_mofu_user_003_c9d21', 1, '2026-07-08 20:10:00', NULL, '2026-07-08 20:10:00'),
(4, 4, 'socket_mofu_user_004_d2e15', 0, '2026-07-07 12:30:00', '2026-07-07 13:10:00', '2026-07-07 12:30:00'),
(5, 5, 'socket_mofu_user_005_e4f22', 1, '2026-07-06 22:15:00', NULL, '2026-07-06 22:15:00'),
(6, 6, 'socket_mofu_user_006_f8g33', 0, '2026-07-05 19:20:00', '2026-07-05 20:00:00', '2026-07-05 19:20:00'),
(7, 7, 'socket_mofu_user_007_g5h41', 1, '2026-07-04 16:40:00', NULL, '2026-07-04 16:40:00'),
(8, 8, 'socket_mofu_user_008_h3j52', 0, '2026-07-01 09:20:00', '2026-07-01 10:05:00', '2026-07-01 09:20:00'),
(9, 9, 'socket_mofu_user_009_j7k62', 1, '2026-07-10 10:00:00', NULL, '2026-07-10 10:00:00'),
(10, 10, 'socket_mofu_user_010_k9l73', 1, '2026-07-10 08:40:00', NULL, '2026-07-10 08:40:00'),
(11, 11, 'socket_mofu_user_011_l2m84', 1, '2026-07-10 14:35:00', NULL, '2026-07-10 14:35:00'),
(12, 12, 'socket_mofu_user_012_m5n91', 0, '2026-07-09 10:00:00', '2026-07-09 10:40:00', '2026-07-09 10:00:00'),
(13, 13, 'socket_mofu_user_013_n8p26', 1, '2026-07-08 13:20:00', NULL, '2026-07-08 13:20:00'),
(14, 14, 'socket_mofu_user_014_p4q37', 0, '2026-07-09 10:10:00', '2026-07-09 11:00:00', '2026-07-09 10:10:00'),
(15, 15, 'socket_mofu_user_015_q6r48', 1, '2026-07-06 18:30:00', NULL, '2026-07-06 18:30:00'),
(16, 16, 'socket_mofu_user_016_r1s59', 1, '2026-07-10 07:45:00', NULL, '2026-07-10 07:45:00'),
(17, 17, 'socket_mofu_user_017_s3t61', 0, '2026-07-03 21:10:00', '2026-07-03 22:00:00', '2026-07-03 21:10:00'),
(18, 18, 'socket_mofu_user_018_t7u72', 1, '2026-07-02 11:20:00', NULL, '2026-07-02 11:20:00'),
(19, 19, 'socket_mofu_user_019_u4v83', 1, '2026-07-09 22:10:00', NULL, '2026-07-09 22:10:00'),
(20, 20, 'socket_mofu_user_020_v8w94', 0, '2026-07-08 19:40:00', '2026-07-08 20:20:00', '2026-07-08 19:40:00'),
(21, 21, 'socket_mofu_user_021_w2x15', 1, '2026-07-10 12:20:00', NULL, '2026-07-10 12:20:00'),
(22, 22, 'socket_mofu_user_022_x5y26', 0, '2026-07-09 17:20:00', '2026-07-09 18:00:00', '2026-07-09 17:20:00'),
(23, 23, 'socket_mofu_user_023_y9z37', 1, '2026-07-02 15:30:00', NULL, '2026-07-02 15:30:00'),
(24, 24, 'socket_mofu_user_024_z1a48', 1, '2026-07-10 09:20:00', NULL, '2026-07-10 09:20:00'),
(25, 25, 'socket_mofu_user_025_a2b59', 0, '2026-07-10 20:10:00', '2026-07-10 21:00:00', '2026-07-10 20:10:00'),
(26, 26, 'socket_mofu_user_026_b3c61', 1, '2026-07-06 10:00:00', NULL, '2026-07-06 10:00:00'),
(27, 27, 'socket_mofu_user_027_c4d72', 1, '2026-07-10 16:30:00', NULL, '2026-07-10 16:30:00'),
(28, 28, 'socket_mofu_user_028_d5e83', 0, '2026-07-09 20:20:00', '2026-07-09 21:10:00', '2026-07-09 20:20:00'),
(29, 29, 'socket_mofu_user_029_e6f94', 1, '2026-07-10 18:40:00', NULL, '2026-07-10 18:40:00'),
(30, 30, 'socket_mofu_user_030_f7g05', 1, '2026-07-10 22:15:00', NULL, '2026-07-10 22:15:00');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `socket_connections`
--
ALTER TABLE `socket_connections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `socket_id` (`socket_id`),
  ADD KEY `idx_socket_user` (`user_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `socket_connections`
--
ALTER TABLE `socket_connections`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `socket_connections`
--
ALTER TABLE `socket_connections`
  ADD CONSTRAINT `socket_connections_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
