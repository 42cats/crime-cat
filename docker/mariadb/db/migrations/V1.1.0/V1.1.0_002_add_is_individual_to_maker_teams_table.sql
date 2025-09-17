-- Migration: V1.1.0_002_add_is_individual_to_maker_teams_table.sql
-- Description: maker_teams 테이블에 개인 팀 여부 컬럼(is_individual) 추가
-- Created: 2025-05-08 14:30:00
USE ${DB_DISCORD};
START TRANSACTION;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = '${DB_DISCORD}' 
               AND TABLE_NAME = 'maker_teams' 
               AND COLUMN_NAME = 'is_individual');

SET @sql := IF(@exist = 0, 'ALTER TABLE `maker_teams`
  ADD COLUMN `is_individual` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT \'개인 팀 여부\'
    AFTER `name`;', 'SELECT "Column is_individual already exists, skipping." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;