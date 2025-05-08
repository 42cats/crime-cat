-- Migration: V1.1.0_005_update_game_themes_table.sql
-- Description: game_themes 테이블의 type 컬럼을 VARCHAR로 변경하고 author FK를 web_users로 업데이트
-- Created: 2025-05-08 14:30:00
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `game_themes`
  DROP FOREIGN KEY `fk_author`,
  MODIFY COLUMN `type` VARCHAR(50) NOT NULL
    COMMENT 'CRIMESCENE, ESCAPE_ROOM, MURDER_MYSTERY, REALWORLD',
  ADD CONSTRAINT `fk_author`
    FOREIGN KEY (`author`) REFERENCES `web_users`(`id`)
      ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
