-- MySQL dump 10.13  Distrib 5.7.22, for Linux (x86_64)
--
-- Host: 172.17.0.3    Database: payment-gateway
-- ------------------------------------------------------
-- Server version	5.7.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Account_Links`
--

DROP TABLE IF EXISTS `Account_Links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Account_Links` (
  `account_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `link_type` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `link_data` varchar(4096) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  KEY `account_id` (`account_id`),
  CONSTRAINT `Account_Links_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `Accounts` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Account_Links`
--

LOCK TABLES `Account_Links` WRITE;
/*!40000 ALTER TABLE `Account_Links` DISABLE KEYS */;
INSERT INTO `Account_Links` VALUES (1,'coupon','63c335297c31758c7361965c32fe72a36a84db334282bf7dc790fbfe067f55ff'),(1,'coupon','5c1f6dfe0cc65cc58b746a8b4ff16568fef064391118331c63492d0f55992aa6'),(1,'coupon','090a76bc62c6a80732c0c2859a683eeaf37f150f1a9d5262cc167a78a60f7c1f'),(1,'coupon','df46290ec5e725e8f52077ece3c543b0b7d81bc90d5b751e2785abf39cd2b942'),(2,'coupon','038f9d9e08e5e53a4c44cbe4d3ff7194f786bda516d3bae5214fca3b95380b78');
/*!40000 ALTER TABLE `Account_Links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Accounts`
--

DROP TABLE IF EXISTS `Accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Accounts` (
  `account_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `account_token` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `comment` varchar(512) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  UNIQUE KEY `account_id` (`account_id`),
  UNIQUE KEY `account_token` (`account_token`),
  UNIQUE KEY `account_name` (`account_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Accounts`
--

LOCK TABLES `Accounts` WRITE;
/*!40000 ALTER TABLE `Accounts` DISABLE KEYS */;
INSERT INTO `Accounts` VALUES (1,'c72bc564d79446b88912d126bde382e71664addaeb48b5db43ffc87b09edd4e29c56d1933fb495457618614f7853b0189ed296387d674c8c3a4b70e8015ea19a','test_account',NULL,1),(2,'7439596a2ff91840b1469e0580be05a81d844c94e2b9b017d927dcbdbefe4bd9ec9873ab2ba6729922f77ffba2dd47eec864935fdc9fa71e1a9f7a28ed103de5','test_account_1',NULL,1),(4,'8eb17747ceefb5add442687c09dd0b537dcd71667cfa345c14676d86c58696f475ec44956ab204846d21f5dd9b669d53f9f941a45fbf36c8c10e19cf2157073d','test_account_2',NULL,1);
/*!40000 ALTER TABLE `Accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Coupons`
--

DROP TABLE IF EXISTS `Coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Coupons` (
  `coupon_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `value` mediumint(8) unsigned DEFAULT '0',
  `currency_symbol` varchar(8) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT 'USD',
  UNIQUE KEY `coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Coupons`
--

LOCK TABLES `Coupons` WRITE;
/*!40000 ALTER TABLE `Coupons` DISABLE KEYS */;
INSERT INTO `Coupons` VALUES ('038f9d9e08e5e53a4c44cbe4d3ff7194f786bda516d3bae5214fca3b95380b78',10,'USD'),('090a76bc62c6a80732c0c2859a683eeaf37f150f1a9d5262cc167a78a60f7c1f',25,'USD'),('5c1f6dfe0cc65cc58b746a8b4ff16568fef064391118331c63492d0f55992aa6',10,'USD'),('63c335297c31758c7361965c32fe72a36a84db334282bf7dc790fbfe067f55ff',10,'USD'),('df46290ec5e725e8f52077ece3c543b0b7d81bc90d5b751e2785abf39cd2b942',3,'USD');
/*!40000 ALTER TABLE `Coupons` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-29  2:32:26
