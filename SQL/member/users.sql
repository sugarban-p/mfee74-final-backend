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
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `user_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` datetime DEFAULT NULL,
  `login_attempts` int NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `users`
--

INSERT INTO `users` (`id`, `user_no`, `email`, `password_hash`, `name`, `nickname`, `phone`, `address`, `avatar`, `status`, `email_verified`, `email_verified_at`, `login_attempts`, `locked_until`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'U26070101T', 'yuki.chen@gmail.com', '$2b$12$WMdblPeB1MyTkFz8sEahR.uJgqJllnQB0KS9pEnL.sQN3okhLB7WO', '陳悠希', 'Yuki', '0912345678', '台北市大安區仁愛路四段100號5樓', 'https://storage.mofu.com/avatar/user001.jpg', 'ACTIVE', 1, '2026-06-10 09:15:22', 0, NULL, '2026-07-13 15:43:15', '2026-06-10 09:10:11', '2026-07-14 15:41:52'),
(2, 'U26070102Y', 'amy.wang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '王雅婷', 'Amy', '0922456789', '新北市板橋區文化路二段120號', 'https://storage.mofu.com/avatar/user002.jpg', 'ACTIVE', 1, '2026-06-11 13:20:18', 0, NULL, '2026-07-13 15:44:37', '2026-06-11 13:15:03', '2026-07-14 15:41:58'),
(3, 'U26070103J', 'kevin.lin@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '林承翰', 'Kevin', '0933567890', '桃園市中壢區中央西路50號8樓', 'https://storage.mofu.com/avatar/user003.jpg', 'ACTIVE', 1, '2026-06-12 10:05:30', 0, NULL, '2026-07-08 20:10:45', '2026-06-12 09:55:20', '2026-07-14 15:42:03'),
(4, 'U26070204T', 'mia.huang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '黃詩涵', 'Mia', '0944678901', '台中市西屯區台灣大道三段200號', 'https://storage.mofu.com/avatar/user004.jpg', 'ACTIVE', 1, '2026-06-13 15:30:10', 0, NULL, '2026-07-07 12:30:18', '2026-06-13 15:25:09', '2026-07-14 15:42:08'),
(5, 'U26070205H', 'jacky.lee@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '李冠廷', 'Jacky', '0955789012', '高雄市左營區博愛三路88號', 'https://storage.mofu.com/avatar/user005.jpg', 'ACTIVE', 1, '2026-06-14 11:45:33', 0, NULL, '2026-07-06 22:15:30', '2026-06-14 11:40:21', '2026-07-14 15:42:13'),
(6, 'U26070206M', 'sophia.tsai@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '蔡佳穎', 'Sophia', '0966890123', '台北市信義區松仁路88號', 'https://storage.mofu.com/avatar/user006.jpg', 'ACTIVE', 1, '2026-06-15 08:30:20', 0, NULL, '2026-07-05 19:22:10', '2026-06-15 08:25:11', '2026-07-14 15:42:19'),
(7, 'U26070307K', 'eric.wu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '吳俊賢', 'Eric', '0977901234', '新北市新店區北新路三段50號', 'https://storage.mofu.com/avatar/user007.jpg', 'ACTIVE', 1, '2026-06-16 14:12:55', 0, NULL, '2026-07-04 16:45:12', '2026-06-16 14:05:30', '2026-07-14 15:42:24'),
(8, 'U26070308N', 'lisa.chang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '張雅雯', 'Lisa', '0988012345', '台北市士林區中山北路六段120號', 'https://storage.mofu.com/avatar/user008.jpg', 'SUSPENDED', 1, '2026-06-17 12:10:30', 3, '2026-07-15 00:00:00', '2026-07-01 09:20:10', '2026-06-17 12:00:20', '2026-07-14 15:42:28'),
(9, 'U26070309S', 'andy.kuo@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '郭柏廷', 'Andy', '0989123456', '桃園市桃園區中正路300號', 'https://storage.mofu.com/avatar/user009.jpg', 'ACTIVE', 0, NULL, 0, NULL, NULL, '2026-06-18 10:15:00', '2026-07-14 15:42:33'),
(10, 'U26070410F', 'vivian.liu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '劉薇安', 'Vivian', '0911223344', '台中市北區學士路88號', 'https://storage.mofu.com/avatar/user010.jpg', 'ACTIVE', 1, '2026-06-19 16:20:00', 0, NULL, '2026-07-10 08:40:22', '2026-06-19 16:15:10', '2026-07-14 15:42:39'),
(11, 'U26070411L', 'cindy.hsu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '許欣怡', 'Cindy', '0922334455', '新北市三重區重新路二段66號', 'https://storage.mofu.com/avatar/user011.jpg', 'ACTIVE', 1, '2026-06-20 10:20:30', 0, NULL, '2026-07-10 14:35:10', '2026-06-20 10:15:20', '2026-07-14 15:42:43'),
(12, 'U26070412Y', 'ben.chou@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '周柏宇', 'Ben', '0933445566', '台北市中山區南京東路三段120號', 'https://storage.mofu.com/avatar/user012.jpg', 'ACTIVE', 0, NULL, 0, NULL, NULL, '2026-06-21 11:25:40', '2026-07-14 15:42:47'),
(13, 'U26070513D', 'grace.yeh@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '葉佳蓉', 'Grace', '0944556677', '新竹市東區光復路二段150號', 'https://storage.mofu.com/avatar/user013.jpg', 'ACTIVE', 1, '2026-06-22 09:30:10', 0, NULL, '2026-07-08 13:20:50', '2026-06-22 09:20:00', '2026-07-14 15:42:53'),
(14, 'U26070514W', 'tony.ho@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '何冠霖', 'Tony', '0955667788', '新竹縣竹北市縣政二路88號', 'https://storage.mofu.com/avatar/user014.jpg', 'ACTIVE', 1, '2026-06-23 15:40:20', 0, NULL, '2026-07-09 10:12:33', '2026-06-23 15:35:10', '2026-07-14 15:43:18'),
(15, 'U26070515E', 'iris.cheng@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '鄭伊婷', 'Iris', '0966778899', '台南市東區東門路二段90號', 'https://storage.mofu.com/avatar/user015.jpg', 'ACTIVE', 1, '2026-06-24 12:20:00', 0, NULL, '2026-07-06 18:30:20', '2026-06-24 12:10:20', '2026-07-14 15:43:22'),
(16, 'U26070616V', 'wayne.yang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '楊博文', 'Wayne', '0977889900', '台北市北投區明德路120號', 'https://storage.mofu.com/avatar/user016.jpg', 'ACTIVE', 1, '2026-06-25 13:15:40', 0, NULL, '2026-07-10 07:45:20', '2026-06-25 13:10:00', '2026-07-14 15:43:26'),
(17, 'U26070617I', 'zoe.luo@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '羅子晴', 'Zoe', '0988990011', '新北市永和區中正路200號', 'https://storage.mofu.com/avatar/user017.jpg', 'ACTIVE', 1, '2026-06-26 10:40:15', 0, NULL, '2026-07-03 21:10:10', '2026-06-26 10:35:00', '2026-07-14 15:43:29'),
(18, 'U26070618A', 'henry.fan@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '范家豪', 'Henry', '0911002233', '台中市南屯區文心路三段88號', 'https://storage.mofu.com/avatar/user018.jpg', 'SUSPENDED', 1, '2026-06-27 14:25:00', 5, '2026-07-20 00:00:00', '2026-07-02 11:20:10', '2026-06-27 14:20:00', '2026-07-14 15:43:33'),
(19, 'U26070719E', 'kelly.wu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '吳佩珊', 'Kelly', '0922113344', '高雄市鼓山區美術館路50號', 'https://storage.mofu.com/avatar/user019.jpg', 'ACTIVE', 1, '2026-06-28 16:20:20', 0, NULL, '2026-07-09 22:10:10', '2026-06-28 16:15:00', '2026-07-14 15:43:38'),
(20, 'U26070720M', 'leo.huang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '黃俊豪', 'Leo', '0933224455', '桃園市龜山區文化一路100號', 'https://storage.mofu.com/avatar/user020.jpg', 'ACTIVE', 1, '2026-06-29 11:30:00', 0, NULL, '2026-07-08 19:40:20', '2026-06-29 11:20:00', '2026-07-14 15:43:41'),
(21, 'U26070721V', 'mina.chang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '張心怡', 'Mina', '0944335566', '台北市松山區南京東路五段66號', 'https://storage.mofu.com/avatar/user021.jpg', 'ACTIVE', 1, '2026-06-30 09:10:00', 0, NULL, '2026-07-10 12:20:30', '2026-06-30 09:00:00', '2026-07-14 15:43:45'),
(22, 'U26070822R', 'steven.lin@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '林威廷', 'Steven', '0955446677', '新北市汐止區新台五路一段88號', 'https://storage.mofu.com/avatar/user022.jpg', 'ACTIVE', 1, '2026-07-01 13:10:00', 0, NULL, '2026-07-09 17:20:10', '2026-07-01 13:00:00', '2026-07-14 15:43:51'),
(23, 'U26070823Z', 'anna.chen@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '陳安琪', 'Anna', '0966557788', '台南市安平區永華路二段100號', 'https://storage.mofu.com/avatar/user023.jpg', 'ACTIVE', 0, NULL, 0, NULL, NULL, '2026-07-02 15:20:00', '2026-07-14 15:43:55'),
(24, 'U26070824R', 'frank.wang@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '王志豪', 'Frank', '0977668899', '彰化縣員林市中山路一段60號', 'https://storage.mofu.com/avatar/user024.jpg', 'ACTIVE', 1, '2026-07-03 10:10:00', 0, NULL, '2026-07-10 09:20:10', '2026-07-03 10:00:00', '2026-07-14 15:43:59'),
(25, 'U26070925T', 'jenny.liu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '劉佳雯', 'Jenny', '0988779900', '台北市內湖區瑞光路168號', 'https://storage.mofu.com/avatar/user025.jpg', 'ACTIVE', 1, '2026-07-04 14:30:00', 0, NULL, '2026-07-10 20:10:10', '2026-07-04 14:20:00', '2026-07-14 15:44:03'),
(26, 'U26070926H', 'alex.hsu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '徐子軒', 'Alex', '0911889900', '新北市淡水區學府路50號', 'https://storage.mofu.com/avatar/user026.jpg', 'SUSPENDED', 1, '2026-07-05 12:10:00', 2, '2026-07-18 00:00:00', '2026-07-06 10:00:00', '2026-07-05 12:00:00', '2026-07-14 15:30:53'),
(27, 'U26070927M', 'vivian.chen@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '陳薇安', 'Vivian', '0922990011', '台中市西區公益路120號', 'https://storage.mofu.com/avatar/user027.jpg', 'ACTIVE', 1, '2026-07-06 09:30:00', 0, NULL, '2026-07-10 16:30:00', '2026-07-06 09:20:00', '2026-07-14 15:30:47'),
(28, 'U26071028L', 'mark.wu@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '吳柏勳', 'Mark', '0933001122', '高雄市前鎮區中山二路88號', 'https://storage.mofu.com/avatar/user028.jpg', 'ACTIVE', 1, '2026-07-07 11:10:00', 0, NULL, '2026-07-09 20:20:00', '2026-07-07 11:00:00', '2026-07-14 15:30:42'),
(29, 'U26071029K', 'sandy.ho@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '何珮琪', 'Sandy', '0944112233', '桃園市蘆竹區南崁路200號', 'https://storage.mofu.com/avatar/user029.jpg', 'ACTIVE', 1, '2026-07-08 15:20:00', 0, NULL, '2026-07-10 18:40:00', '2026-07-08 15:10:00', '2026-07-14 15:30:37'),
(30, 'U26071030D', 'ryan.lee@gmail.com', '$2b$12$LUasKw9Q3EzeWa24p0FSI.ge4ghxvbMGLTI7tL3rrCyjX2wvHTd2a', '李昱辰', 'Ryan', '0955223344', '台北市文山區景興路80號', 'https://storage.mofu.com/avatar/user030.jpg', 'ACTIVE', 1, '2026-07-09 10:10:00', 0, NULL, '2026-07-10 22:15:00', '2026-07-09 10:00:00', '2026-07-14 15:30:25');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_no` (`user_no`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_status` (`status`),
  ADD KEY `idx_users_created` (`created_at`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
