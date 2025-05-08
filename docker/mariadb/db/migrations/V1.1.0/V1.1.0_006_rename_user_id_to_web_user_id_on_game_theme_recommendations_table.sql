-- Migration: V1.1.0_006_rename_user_id_to_web_user_id_on_game_theme_recommendations_table.sql
-- Description: game_theme_recommendations 테이블의 user_id → web_user_id로 컬럼명 변경 및 FK·UNIQUE 키 갱신
-- Created: 2025-05-08 14:30:00
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `game_theme_recommendations`
  DROP FOREIGN KEY `fk_gametheme_recommendations_user_id`,
  DROP KEY `uk_gametheme_recommendations_user_theme`,
  CHANGE COLUMN `user_id` `web_user_id` BINARY(16) NOT NULL
    COMMENT '웹 유저 아이디',
  ADD UNIQUE KEY `uk_gametheme_recommendations_user_theme` (`web_user_id`,`theme_id`),
  ADD CONSTRAINT `fk_gametheme_recommendations_user_id`
    FOREIGN KEY (`web_user_id`) REFERENCES `web_users`(`id`);
SET FOREIGN_KEY_CHECKS=1;
