-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: final_team3
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `event_products`
--

LOCK TABLES `event_products` WRITE;
/*!40000 ALTER TABLE `event_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_intros`
--

LOCK TABLES `product_intros` WRITE;
/*!40000 ALTER TABLE `product_intros` DISABLE KEYS */;
INSERT INTO `product_intros` VALUES (1,1,'avatar','[\"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/Google_mix.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_slider_M_TW-2.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_08.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_03.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_05.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_02.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_09.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_06.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_07.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/滴雞精餐包產品圖_03.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/滴雞精餐包產品圖_04.jpg\", \"https://cdn-v2.dogcatstar.com/prod/2025/10/17/2506602/cat-food-pouch_SP_10.jpg\"]'),(2,1,'description','[\"富含小分子胺基酸，滋補強身、維持活力\", \"4款機能，顧腸胃、泌尿、免疫、皮膚\", \"高嗜口性，滴精香氣搭配慕斯肉泥質地\", \"雙開口設計，拿著餵或擠出來都方便\", \"無人工膠類、無穀、無不良添加物\"]');
/*!40000 ALTER TABLE `product_intros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_items`
--

LOCK TABLES `product_items` WRITE;
/*!40000 ALTER TABLE `product_items` DISABLE KEYS */;
INSERT INTO `product_items` VALUES (1,'CTMC001-001F',1,1,'滴雞精','F','單包40g',52,33,944,'2026-06-22 21:07:00','2026-06-22 21:07:44'),(2,'CTMC001-002F',1,2,'滴魚精','F','單包40g',52,46,942,'2026-06-22 21:07:00','2026-06-22 21:07:44');
/*!40000 ALTER TABLE `product_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_s_tags`
--

LOCK TABLES `product_s_tags` WRITE;
/*!40000 ALTER TABLE `product_s_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_s_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_tags`
--

LOCK TABLES `product_tags` WRITE;
/*!40000 ALTER TABLE `product_tags` DISABLE KEYS */;
INSERT INTO `product_tags` VALUES (1,1,'CT','貓','cat'),(2,1,'DG','狗','dog'),(3,2,'MC','主食','main-course'),(4,2,'TT','零食/點心','treat'),(5,2,'TY','玩具','toy'),(6,2,'LE','牽繩','leash'),(7,3,'IM','幼齡','immature'),(8,3,'MT','成齡','mature');
/*!40000 ALTER TABLE `product_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'CTMC001',1,1,0,'滴雞精/滴魚精滋補主食餐包','每日補補身，養出好體質!','2026-06-22 20:31:06');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_favorites`
--

LOCK TABLES `user_favorites` WRITE;
/*!40000 ALTER TABLE `user_favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_favorites` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-30 16:18:55
