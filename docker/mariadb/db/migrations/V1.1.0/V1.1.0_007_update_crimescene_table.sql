-- Migration: V1.1.0_007_rename_game_theme_id_to_id_on_crimescene_themes_table.sql
-- Description: crimescene_themes 테이블의 game_theme_id → id로 컬럼명 변경 및 game_themes(id) 외래 키(fk_id) 추가
-- Created: 2025-05-08 15:00:00

SET FOREIGN_KEY_CHECKS=0;

-- 1) 컬럼명이 남아있다면 변경
ALTER TABLE `crimescene_themes`
  CHANGE COLUMN IF EXISTS
    `game_theme_id` `id` BINARY(16) NOT NULL COMMENT '게임 테마';

-- 2) 이미 존재하는 외래키 제거 후, 없으면 추가
ALTER TABLE `crimescene_themes`
  DROP FOREIGN KEY IF EXISTS `fk_id`,
  ADD CONSTRAINT IF NOT EXISTS `fk_id`
    FOREIGN KEY (`id`) REFERENCES `game_themes`(`id`)
    ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS=1;