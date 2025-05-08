-- Migration: V1.1.0_007_rename_game_theme_id_to_id_on_crimescene_themes_table.sql
-- Description: crimescene_themes 테이블의 game_theme_id → id로 컬럼명 변경 및 game_themes(id) 외래 키(fk_id) 추가
-- Created: 2025-05-08 15:00:00

SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `crimescene_themes`
  CHANGE COLUMN `game_theme_id` `id` BINARY(16) NOT NULL
    COMMENT '게임 테마';

ALTER TABLE `crimescene_themes`
  ADD CONSTRAINT `fk_id`
    FOREIGN KEY (`id`) REFERENCES `game_themes`(`id`)
    ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS=1;