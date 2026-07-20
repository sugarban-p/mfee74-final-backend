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
-- 資料表結構 `sessions`
--

CREATE TABLE `sessions` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `access_token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- 傾印資料表的資料 `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `access_token_hash`, `refresh_token_hash`, `user_agent`, `ip`, `device_name`, `expires_at`, `revoked_at`, `created_at`) VALUES
(1, 1, '1b0eb86b920ac4bc4119faae0f8318ccfd080db68b39359761aabce57eee65b3', 'e2264092125a50332f75b32d37c313cdff056d56ffa7445546e6ec14df919513', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5) AppleWebKit/537.36 Chrome/137.0', '118.163.25.101', 'MacBook Pro', '2026-08-09 21:35:20', NULL, '2026-07-10 21:35:20'),
(2, 2, 'e5542cd182e3335e9889f492d3064a728528fd66e439118d01bf1986d62794e7', 'e1a8fa1df5caea30b9d472dead1da14fc90c518d6957eef381b4c6610f31f3a4', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit Safari', '118.163.25.102', 'iPhone 15 Pro', '2026-08-08 18:20:15', NULL, '2026-07-09 18:20:15'),
(3, 3, '33011b82f66a110d76faa7d07366b4369a379cdef1508eb268a5ef5eea20bd61', '4acf67ef5dd1fd2fda620bacaff64f157452d4b499c581edf7ec52c157062fc9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/137', '118.163.25.103', 'Windows Desktop', '2026-08-07 20:10:45', NULL, '2026-07-08 20:10:45'),
(4, 4, '1376a84d46013ebc52cbf23d0021d0520043e7bf75d22502a04d23c06054f598', 'f9b3f295976ec2b019b3f69e697289a23cef937e885c05ebe7ca2c8a350a02d1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/18', '118.163.25.104', 'MacBook Air', '2026-08-07 12:30:18', NULL, '2026-07-07 12:30:18'),
(5, 5, 'd905c46213b9d6839e9c28a564c13f5bd5b7d2785fa34e0ae646c12867af8230', '840aba96653621e40cd3e5bad469e4a94855a893b97c3e2f00bc316ce2dc1df2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5) Safari', '118.163.25.105', 'iPhone 15', '2026-08-06 22:15:30', NULL, '2026-07-06 22:15:30'),
(6, 6, '423aa7893483a3ba91b7866728cb3b2720613eaae85524751f2cd9d1541a1acb', '758790767189bb21e69fc4db17b2da91067e73ecbb2a317da7762b3d0419a27c', 'Mozilla/5.0 (iPad; CPU OS 18_5) Safari', '118.163.25.106', 'iPad Air', '2026-08-05 19:22:10', NULL, '2026-07-05 19:22:10'),
(7, 7, '3be99daa907abfb6894accb51be8114dc3cbf8b5f6c5ec2d60977f13674ee5f1', '954e1ab9e7e68eedc97f4a031a9df83c90e63656349605e0550401e816fa6f32', 'Mozilla/5.0 Windows NT 10.0 Chrome', '118.163.25.107', 'Windows Laptop', '2026-08-04 16:45:12', NULL, '2026-07-04 16:45:12'),
(8, 8, '29f93d419f04c7c7e30a64f7766f230be8bf5c75961f983d302fb0d69441c694', 'f0845e6cfa5921058e864fab9551dcbde150f06146b0d0959199cecd277c1f9e', 'Mozilla/5.0 Chrome', '118.163.25.108', 'Desktop PC', '2026-08-01 09:20:10', '2026-07-05 10:00:00', '2026-07-01 09:20:10'),
(9, 9, '8dc398fb4f4edbde4dfadf1c947dfc7b26062be349da8bc1ab0c31f71c2c6d0b', '2c5237afe1684ab6402cb22442dec3a191d0704b6fe3faf03d092a2d78567b4c', 'Mozilla/5.0 Android Chrome', '118.163.25.109', 'Android Phone', '2026-08-10 10:00:00', NULL, '2026-07-10 10:00:00'),
(10, 10, '98c3b760da8ee2e87b71744a56ddb2b8077bcbeb4b024d9a194def37f89832ce', '5f5f08791468833190e508d44672e1ae370a83f8ec8a3a37c8928511120e9e80', 'Mozilla/5.0 MacBook Chrome', '118.163.25.110', 'MacBook Pro', '2026-08-10 08:40:22', NULL, '2026-07-10 08:40:22'),
(11, 11, 'd9142929754875c095a5d91e1dec554a4209c762de7c725c5f18c4bf7e2f258f', '7f2cd1cefab1eea0a2c7d49b9540e648b4fd4aa9543d196126c7bc5c51f11635', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5) Chrome/137', '118.163.25.111', 'MacBook Pro', '2026-08-10 14:35:10', NULL, '2026-07-10 14:35:10'),
(12, 12, '38fa27b7e8f63646bc495eb5262e4d53c7616e1e337233584742fa50e89e7328', '85bae3dab4539cb59021a208ce2822e158d73a5323d93adfaf04c8baf7ce9223', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 Safari)', '118.163.25.112', 'iPhone 15 Pro', '2026-08-09 10:00:00', NULL, '2026-07-09 10:00:00'),
(13, 13, 'a91c20c58938acad88111a1545c4ab87ae6449b9690b6229a4e93a5547dd9289', 'a6cc837068b88dda6a11d9a1ee098aac37032db7aad5904579f39699a9267183', 'Mozilla/5.0 Windows NT 10.0 Edge', '118.163.25.113', 'Windows 11 PC', '2026-08-08 13:20:50', NULL, '2026-07-08 13:20:50'),
(14, 14, '6d3af836a629f4f65a225472951baf28df1ebb7804ac70faad65bc71b351c4af', 'cc06da2f5d589b6d47da1f485d36dfed748991b9745a50683d53a036359d2fb8', 'Mozilla/5.0 Macintosh Safari', '118.163.25.114', 'iMac', '2026-08-09 10:12:33', NULL, '2026-07-09 10:12:33'),
(15, 15, 'f738bb7febd7ed3ca3a855f0cc0e9edaa47d94b62735d787615eba00a09a47dd', 'c126628cbba1c553e6472897b6bfea96f4f3fae61a4435772b2129c0f6f33620', 'Mozilla/5.0 Android Chrome', '118.163.25.115', 'Android Phone', '2026-08-06 18:30:20', NULL, '2026-07-06 18:30:20'),
(16, 16, 'e566f8e13c92669eb10b20c2ebccdf1491e291da643030dcb6332f7efde096c3', 'a771b4298069cca7d24328610f0cfcb2d2131f18f37c9ee9c24b7dc86980a2df', 'Mozilla/5.0 Windows Chrome', '118.163.25.116', 'Windows Desktop', '2026-08-10 07:45:20', NULL, '2026-07-10 07:45:20'),
(17, 17, '557a13e8bc5e43e8845bd8611ddbb0c5d241e3d87ae31668d9e2bf2b9455a4c2', '93f5fcdfa1696e216151baebc12a2c5001ad211c3a4fedffa51279fd12901af5', 'Mozilla/5.0 iPad Safari', '118.163.25.117', 'iPad Pro', '2026-08-03 21:10:10', NULL, '2026-07-03 21:10:10'),
(18, 18, '320d4bdb6ec2330b108c838d37acff91119b309ece7624216f5743479458bdef', '78b9517de24e3b11e69baea3055cabc1d5b9d7c7a660512826fff683f0c8abcc', 'Mozilla/5.0 Chrome', '118.163.25.118', 'Windows Laptop', '2026-08-02 11:20:10', '2026-07-04 09:00:00', '2026-07-02 11:20:10'),
(19, 19, '6269eee685d1f6220b8045e11f07cc6e9f54bf1a0d15341b7800f83f2eb54c5b', '7b1bc1331bb6a77b67c3eda888231ea26300c08303954740e519628f18b5263c', 'Mozilla/5.0 MacBook Chrome', '118.163.25.119', 'MacBook Air', '2026-08-09 22:10:10', NULL, '2026-07-09 22:10:10'),
(20, 20, '981fa53d0fd1ee4c14002ea5973dcdf6f131f5039d9442209049c0b3978bb172', '84485bf3ae0ebf777d44e62da4f0e31996c3f0cd0b79b91d29111005fb5af8ce', 'Mozilla/5.0 iPhone Safari', '118.163.25.120', 'iPhone 14', '2026-08-08 19:40:20', NULL, '2026-07-08 19:40:20'),
(21, 21, '8c975855a236c4ce7c5de4e854043f5a54ff2762be2f09fb541c25c1290fee5a', '0fdef919e35654e3f5e24b3f04c9d856657c43c8f995f24541fc1fca0f900331', 'Mozilla/5.0 Mac OS Chrome', '118.163.25.121', 'MacBook Pro', '2026-08-10 12:20:30', NULL, '2026-07-10 12:20:30'),
(22, 22, 'bda9ff7de4b94e2c69ccc2d4650cd4c54b48171de8c8805c2117b34da3f1aba8', '183858285b4055ed4702501cd896d8be331b7f43088dd3243eba5f777f05cac9', 'Mozilla/5.0 Windows Edge', '118.163.25.122', 'Windows 11', '2026-08-09 17:20:10', NULL, '2026-07-09 17:20:10'),
(23, 23, '3c5eec638282e28cc21a827dcd5a433c1b551eebb1525f9538e7db0cc2fa90d4', '21db2cdb2764ed9e91c878956b7dcf72327186b6bd49eddaf6c8f80d244a20be', 'Mozilla/5.0 Android Chrome', '118.163.25.123', 'Samsung Galaxy', '2026-08-07 08:30:00', NULL, '2026-07-07 08:30:00'),
(24, 24, '42e2799f44b47e90569ceddae0096509ea07f26ae19ea427d12f2c3ba41ae006', 'c1dba800d23425b77815cc62b9969e99d50f7eca1689655dc714787e2b81c03a', 'Mozilla/5.0 MacBook Safari', '118.163.25.124', 'MacBook Air', '2026-08-10 09:20:10', NULL, '2026-07-10 09:20:10'),
(25, 25, '0eab3c3a933788890daf945d164ba60230dbf8af4ac0721cc9dbded5cfe45898', '757f1dd883f8cc704e8b37b959afce869f86886db9563f094881e0db06479bde', 'Mozilla/5.0 iPhone Safari', '118.163.25.125', 'iPhone 15 Pro', '2026-08-10 20:10:10', NULL, '2026-07-10 20:10:10'),
(26, 26, '55fdbc8783a9f5d6883ea2590460888e6fdc1a4c8be41073bf60cb673b1c27e0', '86430769538d3fbf365a879cbb5a47a812b1ddf23ce0cba22ebf261277cfce08', 'Mozilla/5.0 Chrome Windows', '118.163.25.126', 'Windows PC', '2026-08-06 10:00:00', '2026-07-08 10:00:00', '2026-07-06 10:00:00'),
(27, 27, '1d98be90c7551e561c3d13fc35c380c1ac5ff735c2ab26f3c721041adcab14ad', '36528d0d78b38af9a94efb2beb1db0784ef24475525ba9b42ad43a0b79ed8c27', 'Mozilla/5.0 MacOS Chrome', '118.163.25.127', 'iMac', '2026-08-10 16:30:00', NULL, '2026-07-10 16:30:00'),
(28, 28, '31c858a1ede8e5524e3ffdb708613fae248c20494aae5e768d29ad1bbe628297', '7652d8a91ab48b5032d13e2efdb77867ae0ffb6d8d6a0903123d3c7f9ae5816c', 'Mozilla/5.0 Android Chrome', '118.163.25.128', 'Pixel Phone', '2026-08-09 20:20:00', NULL, '2026-07-09 20:20:00'),
(29, 29, '1fb0c96c8196ea781c10acddb9d9d1e94948d0578b34148d823604e549bddd0c', '6fa2f3714f47177d9760d2e68bf888c56efaa749a4aa9b8df4605328c9309cfa', 'Mozilla/5.0 Windows Chrome', '118.163.25.129', 'Windows Laptop', '2026-08-10 18:40:00', NULL, '2026-07-10 18:40:00'),
(30, 30, '7a97e398733cfdcbaa0cfeb8f07ecf972e265462991513f40862a2eeff1485a5', '760c37c534d8261fa9e199200c9cf5bacdca2c8a7551f0d754dac8aad1ac63d8', 'Mozilla/5.0 Macintosh Chrome', '118.163.25.130', 'MacBook Pro', '2026-08-10 22:15:00', NULL, '2026-07-10 22:15:00'),
(33, 1, 'c0d1e307634486a1b2c80d8ae91fae9e653a3102a066169e790750e6004bcb62', '84cd62fc05f0839b7cc6131c5409f2a2f8f64eaaedea6d32e80295a52155690d', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '::1', 'Mac/Chrome', '2026-07-20 15:34:53', NULL, '2026-07-13 15:34:53'),
(34, 1, 'c5de4eaff20ba1498be345d8133844cd062e68b2cd2ab9ed6d92979a31c2e63a', 'f7cb9f98aec297b62c2ccf9b8bce8df2bc2046c8cab1b0eb31fee4c57275061f', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '::1', 'Mac/Chrome', '2026-07-20 15:43:16', NULL, '2026-07-13 15:43:15'),
(35, 2, 'a4c32bc6f3afc5aecb8f2a6a43a936db3b370843a42b371540a0e7b3abcfb27e', '87f1d3ea24493b1235dc1175836e221f76bed718c3e6e2b6915302939a175cb1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '::1', 'Mac/Chrome', '2026-07-20 15:44:38', NULL, '2026-07-13 15:44:38');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refresh_token_hash` (`refresh_token_hash`),
  ADD KEY `idx_sessions_user` (`user_id`),
  ADD KEY `idx_sessions_expire` (`expires_at`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
