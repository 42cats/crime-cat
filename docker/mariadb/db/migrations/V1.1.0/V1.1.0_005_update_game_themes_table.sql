-- Migration: V1.1.0_005_update_game_themes_table.sql
-- Description: game_themes 테이블의 type 컬럼을 VARCHAR로 변경하고 author FK를 web_users로 업데이트
-- Created: 2025-05-08 14:30:00

USE ${DB_DISCORD};

-- 테이블 및 컬럼 확인
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                   WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_themes');

SET @type_is_varchar = IF(@table_exists > 0, 
                        (SELECT DATA_TYPE = 'varchar' FROM information_schema.columns 
                         WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_themes' 
                         AND column_name = 'type'), 0);

-- FK 존재 여부 및 참조 테이블 확인
SET @fk_info = (SELECT REFERENCED_TABLE_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = '${DB_DISCORD}' 
                AND TABLE_NAME = 'game_themes' 
                AND CONSTRAINT_NAME = 'fk_author' 
                AND REFERENCED_TABLE_NAME = 'web_users');

-- 변경이 필요한 경우에만 실행
SET @needs_update = (@table_exists > 0 AND (@type_is_varchar = 0 OR @fk_info IS NULL));

SET @sql = IF(@needs_update, '
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `game_themes`
  DROP FOREIGN KEY IF EXISTS `fk_author`,
  MODIFY COLUMN `type` VARCHAR(50) NOT NULL
    COMMENT \'CRIMESCENE, ESCAPE_ROOM, MURDER_MYSTERY, REALWORLD\',
  ADD CONSTRAINT `fk_author`
    FOREIGN KEY (`author`) REFERENCES `web_users`(`id`)
      ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;', 'SELECT "game_themes 테이블이 이미 최신 상태입니다." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
