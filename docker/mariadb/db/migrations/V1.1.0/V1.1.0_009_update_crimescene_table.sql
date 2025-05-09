-- Migration: V1.1.0_009_rename_game_theme_id_to_id_on_crimescene_themes_table.sql
-- Description: crimescene_themes 테이블의 game_theme_id → id로 컬럼명 변경 및 game_themes(id) 외래 키(fk_id) 추가
-- Created: 2025-05-08 15:00:00
USE ${DB_DISCORD};

DELIMITER $$

CREATE PROCEDURE update_crimescene_themes()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SELECT '마이그레이션 중 오류 발생: 롤백 완료' AS message;
  END;

  START TRANSACTION;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
      AND table_name = 'crimescene_themes'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'crimescene_themes'
      AND column_name = 'game_theme_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'crimescene_themes'
      AND column_name = 'id'
  ) THEN
  
    SET FOREIGN_KEY_CHECKS = 0;

    -- 외래 키 존재 여부 확인 및 제거
    IF EXISTS (
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE table_schema = DATABASE()
        AND table_name = 'crimescene_themes'
        AND constraint_name = 'fk_id'
    ) THEN
      ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_id`;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE table_schema = DATABASE()
        AND table_name = 'crimescene_themes'
        AND constraint_name = 'fk_crimescene_themes_game_theme_id'
    ) THEN
      ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_crimescene_themes_game_theme_id`;
    END IF;

    -- 컬럼 이름 변경
    ALTER TABLE `crimescene_themes`
      CHANGE COLUMN `game_theme_id` `id` BINARY(16) NOT NULL COMMENT '게임 테마';

    -- 외래 키 추가
    ALTER TABLE `crimescene_themes`
      ADD CONSTRAINT `fk_id`
      FOREIGN KEY (`id`) REFERENCES `game_themes` (`id`)
      ON DELETE CASCADE;

    SET FOREIGN_KEY_CHECKS = 1;

    COMMIT;
    SELECT '마이그레이션 완료' AS message;
  
  ELSE
    ROLLBACK;
    SELECT 'crimescene_themes 테이블이 없거나 이미 변경되었습니다.' AS message;
  END IF;

END$$

DELIMITER ;

CALL update_crimescene_themes();

DROP PROCEDURE IF EXISTS update_crimescene_themes;
