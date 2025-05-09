-- Migration: V1.1.0_007_rename_game_theme_id_to_id_on_crimescene_themes_table.sql
-- Description: crimescene_themes 테이블의 game_theme_id → id로 컬럼명 변경 및 game_themes(id) 외래 키(fk_id) 추가
-- Created: 2025-05-08 15:00:00

USE `${DB_DISCORD}`;

-- 1) 테이블·컬럼 존재 여부 확인
SET @table_exists = (
  SELECT COUNT(*) 
    FROM information_schema.tables 
   WHERE table_schema = '${DB_DISCORD}' 
     AND table_name = 'crimescene_themes'
);

SET @old_col_exists = IF(
  @table_exists > 0,
  (SELECT COUNT(*) 
     FROM information_schema.columns 
    WHERE table_schema = '${DB_DISCORD}' 
      AND table_name = 'crimescene_themes' 
      AND column_name = 'game_theme_id'
  ),
  0
);

SET @new_col_exists = IF(
  @table_exists > 0,
  (SELECT COUNT(*) 
     FROM information_schema.columns 
    WHERE table_schema = '${DB_DISCORD}' 
      AND table_name = 'crimescene_themes' 
      AND column_name = 'id'
  ),
  0
);

-- 2) 변경 필요 조건: 테이블 있으면, old 컬럼은 있고 new 컬럼은 없을 때
SET @needs_update = (
  @table_exists > 0 
  AND @old_col_exists > 0 
  AND @new_col_exists = 0
);

-- 3) 동적 SQL 생성
SET @sql = IF(
  @needs_update,
  '
  SET FOREIGN_KEY_CHECKS=0;
  ALTER TABLE `crimescene_themes`
    DROP FOREIGN KEY IF EXISTS `fk_id`,
    CHANGE COLUMN `game_theme_id` `id` BINARY(16) NOT NULL COMMENT \'게임 테마\',
    ADD CONSTRAINT IF NOT EXISTS `fk_id`
      FOREIGN KEY (`id`) REFERENCES `game_themes`(`id`)
      ON DELETE CASCADE;
  SET FOREIGN_KEY_CHECKS=1;
  ',
  'SELECT "crimescene_themes 테이블이 없거나 이미 변경되었습니다." AS message;'
);

-- 4) 실행
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
