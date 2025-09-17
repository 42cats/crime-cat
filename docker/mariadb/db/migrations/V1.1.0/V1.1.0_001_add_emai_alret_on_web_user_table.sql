-- Migration: V1.1.0_001_add_emai_alret_on_web_user_table.sql
-- Description: 웹유저에 이메일 알림 설정여부 추가
-- Created: 2025-05-08 14:30:00

USE ${DB_DISCORD};
START TRANSACTION;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = '${DB_DISCORD}' 
               AND TABLE_NAME = 'web_users' 
               AND COLUMN_NAME = 'email_alarm');

SET @sql := IF(@exist = 0, 'ALTER TABLE `web_users`
  ADD COLUMN `email_alarm` BIT(1) NOT NULL DEFAULT b\'0\'
    COMMENT \'이메일 수신설정\'
    AFTER `social_links`;', 'SELECT "Column email_alarm already exists, skipping." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;