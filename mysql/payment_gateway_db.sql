CREATE TABLE IF NOT EXISTS `Accounts` (
  `account_id` bigint unsigned auto_increment,
  `account_token` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `comment` varchar(512) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `active` bool DEFAULT 1,
  UNIQUE KEY `account_id` (`account_id`),
  UNIQUE (`account_token`),
  UNIQUE (`account_name`)
  ) ENGINE=INNODB DEFAULT CHARSET=utf8;

 CREATE TABLE IF NOT EXISTS `Account_Links` (
   `account_id` bigint unsigned auto_increment,
   `link_type` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
   `link_data` varchar(4096) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
   FOREIGN KEY (`account_id`) REFERENCES Accounts(`account_id`)
   ) ENGINE=INNODB DEFAULT CHARSET=utf8;

 CREATE TABLE IF NOT EXISTS `Coupons` (
   `coupon_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
   `value` mediumint unsigned DEFAULT 0,
   `currency_symbol` varchar(8) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT "USD",
   UNIQUE KEY `coupon_id` (`coupon_id`(64))
   ) ENGINE=INNODB DEFAULT CHARSET=utf8;
