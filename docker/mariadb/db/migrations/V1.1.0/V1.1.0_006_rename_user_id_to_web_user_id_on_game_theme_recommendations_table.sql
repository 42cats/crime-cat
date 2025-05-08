-- Migration: V1.1.0_006_rename_user_id_to_web_user_id_on_game_theme_recommendations_table.sql
-- Description: game_theme_recommendations 테이블의 user_id → web_user_id로 컬럼명 변경 및 FK·UNIQUE 키 갱신
-- Created: 2025-05-08 14:30:00

USE ${DB_DISCORD};

-- 테이블 및 컬럼 확인
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                   WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_theme_recommendations');

SET @user_id_exists = IF(@table_exists > 0, 
                      (SELECT COUNT(*) FROM information_schema.columns 
                       WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_theme_recommendations' 
                       AND column_name = 'user_id'), 0);

SET @web_user_id_exists = IF(@table_exists > 0, 
                          (SELECT COUNT(*) FROM information_schema.columns 
                           WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_theme_recommendations' 
                           AND column_name = 'web_user_id'), 0);

-- 적용해야할 조건: 테이블이 있고, user_id가 있고, web_user_id가 없을때
SET @needs_update = (@table_exists > 0 AND @user_id_exists > 0 AND @web_user_id_exists = 0);

SET @sql = IF(@needs_update, '
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `game_theme_recommendations`
  DROP FOREIGN KEY IF EXISTS `fk_gametheme_recommendations_user_id`,
  DROP KEY IF EXISTS `uk_gametheme_recommendations_user_theme`,
  CHANGE COLUMN `user_id` `web_user_id` BINARY(16) NOT NULL
    COMMENT \'\\uc6f9 \\uc720\\uc800 \\uc544\\uc774\\ub514\',
  ADD UNIQUE KEY `uk_gametheme_recommendations_user_theme` (`web_user_id`,`theme_id`),
  ADD CONSTRAINT `fk_gametheme_recommendations_user_id`
    FOREIGN KEY (`web_user_id`) REFERENCES `web_users`(`id`);
SET FOREIGN_KEY_CHECKS=1;', 'SELECT "game_theme_recommendations 테이블이 존재하지 않거나 이미 변경되었습니다." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
