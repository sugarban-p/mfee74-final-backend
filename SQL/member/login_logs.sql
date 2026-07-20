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
-- 資料表結構 `login_logs`
--

CREATE TABLE `login_logs` (
  `id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` enum('PASSWORD','GOOGLE') COLLATE utf8mb4_unicode_ci DEFAULT 'PASSWORD',
  `ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `os` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `login_logs`
--

INSERT INTO `login_logs` (`id`, `user_id`, `email`, `method`, `ip`, `country`, `city`, `user_agent`, `browser`, `os`, `device`, `success`, `reason`, `created_at`) VALUES
(1, 1, 'yuki.chen@gmail.com', 'GOOGLE', '118.163.25.101', 'Taiwan', 'Taipei', 'Mozilla/5.0 Macintosh Chrome', 'Chrome', 'macOS', 'Desktop', 1, NULL, '2026-07-10 21:35:20'),
(2, 1, 'yuki.chen@gmail.com', 'PASSWORD', '118.163.25.150', 'Taiwan', 'Taipei', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-08 18:20:10'),
(3, 2, 'amy.wang@gmail.com', 'GOOGLE', '118.163.25.102', 'Taiwan', 'New Taipei', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-09 18:20:15'),
(4, 3, 'kevin.lin@gmail.com', 'PASSWORD', '118.163.25.103', 'Taiwan', 'Taoyuan', 'Mozilla/5.0 Windows Chrome', 'Chrome', 'Windows 11', 'Desktop', 1, NULL, '2026-07-08 20:10:45'),
(5, 4, 'mia.huang@gmail.com', 'PASSWORD', '118.163.25.104', 'Taiwan', 'Taichung', 'Mozilla/5.0 Mac Safari', 'Safari', 'macOS', 'Laptop', 1, NULL, '2026-07-07 12:30:18'),
(6, 5, 'jacky.lee@gmail.com', 'GOOGLE', '118.163.25.105', 'Taiwan', 'Kaohsiung', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-06 22:15:30'),
(7, 6, 'sophia.tsai@gmail.com', 'PASSWORD', '118.163.25.106', 'Taiwan', 'Taipei', 'Mozilla/5.0 iPad Safari', 'Safari', 'iPadOS', 'Tablet', 1, NULL, '2026-07-05 19:22:10'),
(8, 7, 'eric.wu@gmail.com', 'GOOGLE', '118.163.25.107', 'Taiwan', 'New Taipei', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 1, NULL, '2026-07-04 16:45:12'),
(9, 8, 'lisa.chang@gmail.com', 'PASSWORD', '118.163.25.108', 'Taiwan', 'Taipei', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Incorrect password', '2026-07-01 09:20:10'),
(10, 9, 'andy.kuo@gmail.com', 'PASSWORD', '118.163.25.109', 'Taiwan', 'Taoyuan', 'Mozilla/5.0 Android Chrome', 'Chrome', 'Android', 'Mobile', 1, NULL, '2026-07-10 10:00:00'),
(11, 10, 'vivian.liu@gmail.com', 'GOOGLE', '118.163.25.110', 'Taiwan', 'Taipei', 'Mozilla/5.0 Mac Chrome', 'Chrome', 'macOS', 'Desktop', 1, NULL, '2026-07-10 08:40:22'),
(12, 11, 'cindy.hsu@gmail.com', 'PASSWORD', '118.163.25.111', 'Taiwan', 'New Taipei', 'Mozilla/5.0 Windows Edge', 'Edge', 'Windows 11', 'Desktop', 1, NULL, '2026-07-10 14:35:10'),
(13, 12, 'ben.chou@gmail.com', 'PASSWORD', '118.163.25.112', 'Taiwan', 'Taipei', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Incorrect password', '2026-07-09 10:00:00'),
(14, 13, 'grace.yeh@gmail.com', 'GOOGLE', '118.163.25.113', 'Taiwan', 'Hsinchu', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-08 13:20:50'),
(15, 14, 'tony.ho@gmail.com', 'PASSWORD', '118.163.25.114', 'Taiwan', 'Hsinchu', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 1, NULL, '2026-07-09 10:12:33'),
(16, 15, 'iris.cheng@gmail.com', 'GOOGLE', '118.163.25.115', 'Taiwan', 'Tainan', 'Mozilla/5.0 Android Chrome', 'Chrome', 'Android', 'Mobile', 1, NULL, '2026-07-06 18:30:20'),
(17, 16, 'wayne.yang@gmail.com', 'PASSWORD', '118.163.25.116', 'Taiwan', 'Taipei', 'Mozilla/5.0 Windows Chrome', 'Chrome', 'Windows 11', 'Desktop', 1, NULL, '2026-07-10 07:45:20'),
(18, 17, 'zoe.luo@gmail.com', 'GOOGLE', '118.163.25.117', 'Taiwan', 'New Taipei', 'Mozilla/5.0 iPad Safari', 'Safari', 'iPadOS', 'Tablet', 1, NULL, '2026-07-03 21:10:10'),
(19, 18, 'henry.fan@gmail.com', 'PASSWORD', '118.163.25.118', 'Taiwan', 'Taichung', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Incorrect password', '2026-07-02 11:20:10'),
(20, 19, 'kelly.wu@gmail.com', 'GOOGLE', '118.163.25.119', 'Taiwan', 'Kaohsiung', 'Mozilla/5.0 Mac Chrome', 'Chrome', 'macOS', 'Laptop', 1, NULL, '2026-07-09 22:10:10'),
(21, 20, 'leo.huang@gmail.com', 'PASSWORD', '118.163.25.120', 'Taiwan', 'Taoyuan', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-08 19:40:20'),
(22, 21, 'mina.chang@gmail.com', 'GOOGLE', '118.163.25.121', 'Taiwan', 'Taipei', 'Mozilla/5.0 Mac Chrome', 'Chrome', 'macOS', 'Desktop', 1, NULL, '2026-07-10 12:20:30'),
(23, 22, 'steven.lin@gmail.com', 'PASSWORD', '118.163.25.122', 'Taiwan', 'New Taipei', 'Mozilla/5.0 Edge', 'Edge', 'Windows 11', 'Desktop', 1, NULL, '2026-07-09 17:20:10'),
(24, 23, 'anna.chen@gmail.com', 'PASSWORD', '118.163.25.123', 'Taiwan', 'Tainan', 'Mozilla/5.0 Chrome', 'Chrome', 'Android', 'Mobile', 0, 'Incorrect password', '2026-07-02 15:30:00'),
(25, 24, 'frank.wang@gmail.com', 'PASSWORD', '118.163.25.124', 'Taiwan', 'Changhua', 'Mozilla/5.0 Mac Safari', 'Safari', 'macOS', 'Laptop', 1, NULL, '2026-07-10 09:20:10'),
(26, 25, 'jenny.liu@gmail.com', 'GOOGLE', '118.163.25.125', 'Taiwan', 'Taipei', 'Mozilla/5.0 iPhone Safari', 'Safari', 'iOS', 'Mobile', 1, NULL, '2026-07-10 20:10:10'),
(27, 26, 'alex.hsu@gmail.com', 'PASSWORD', '118.163.25.126', 'Taiwan', 'New Taipei', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Account locked', '2026-07-06 10:00:00'),
(28, 27, 'vivian.chen@gmail.com', 'GOOGLE', '118.163.25.127', 'Taiwan', 'Taichung', 'Mozilla/5.0 Mac Chrome', 'Chrome', 'macOS', 'Desktop', 1, NULL, '2026-07-10 16:30:00'),
(29, 28, 'mark.wu@gmail.com', 'PASSWORD', '118.163.25.128', 'Taiwan', 'Kaohsiung', 'Mozilla/5.0 Android Chrome', 'Chrome', 'Android', 'Mobile', 1, NULL, '2026-07-09 20:20:00'),
(30, 29, 'sandy.ho@gmail.com', 'PASSWORD', '118.163.25.129', 'Taiwan', 'Taoyuan', 'Mozilla/5.0 Windows Chrome', 'Chrome', 'Windows 11', 'Desktop', 1, NULL, '2026-07-10 18:40:00'),
(31, 30, 'ryan.lee@gmail.com', 'GOOGLE', '118.163.25.130', 'Taiwan', 'Taipei', 'Mozilla/5.0 Mac Chrome', 'Chrome', 'macOS', 'Desktop', 1, NULL, '2026-07-10 22:15:00'),
(32, 8, 'lisa.chang@gmail.com', 'PASSWORD', '45.77.21.88', 'Taiwan', 'Taipei', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Incorrect password', '2026-07-02 03:15:20'),
(33, 12, 'ben.chou@gmail.com', 'PASSWORD', '45.77.21.90', 'Taiwan', 'Taichung', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Incorrect password', '2026-07-09 02:20:10'),
(34, 26, 'alex.hsu@gmail.com', 'PASSWORD', '45.77.21.91', 'Taiwan', 'Kaohsiung', 'Mozilla/5.0 Chrome', 'Chrome', 'Windows', 'Desktop', 0, 'Account locked', '2026-07-08 04:10:30'),
(35, NULL, 'copilot.test.1783924504@example.com', 'PASSWORD', '::1', NULL, NULL, 'curl/8.7.1', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 14:35:09'),
(36, NULL, 'fullfix_a@example.com', 'PASSWORD', '::1', NULL, NULL, 'curl/8.7.1', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 14:48:35'),
(37, NULL, 'smoke_1783925684276@example.com', 'PASSWORD', '::1', NULL, NULL, 'node', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 14:54:48'),
(38, NULL, 'smoke_1783925732152@example.com', 'PASSWORD', '::1', NULL, NULL, 'node', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 14:55:35'),
(39, NULL, 'smoke_1783926783646@example.com', 'PASSWORD', '::1', NULL, NULL, 'node', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 15:13:08'),
(40, NULL, 'smoke_1783926807238@example.com', 'PASSWORD', '::1', NULL, NULL, 'node', 'Unknown', 'Unknown', 'desktop', 1, NULL, '2026-07-13 15:13:31'),
(41, 1, 'yuki.chen@gmail.com', 'PASSWORD', '::1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Chrome', 'Mac', 'desktop', 1, NULL, '2026-07-13 15:34:53'),
(42, 1, 'yuki.chen@gmail.com', 'PASSWORD', '::1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Chrome', 'Mac', 'desktop', 1, NULL, '2026-07-13 15:43:15'),
(43, 2, 'amy.wang@gmail.com', 'PASSWORD', '::1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Chrome', 'Mac', 'desktop', 1, NULL, '2026-07-13 15:44:38'),
(44, NULL, 'test@pet.local', 'PASSWORD', '::1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Chrome', 'Mac', 'desktop', 0, 'INVALID_CREDENTIALS', '2026-07-13 15:52:11'),
(45, NULL, 'yixuana429@gmail.com', 'PASSWORD', '::1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', 'Chrome', 'Mac', 'desktop', 1, NULL, '2026-07-13 16:25:48');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_login_user_time` (`user_id`,`created_at`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `login_logs`
--
ALTER TABLE `login_logs`
  ADD CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
