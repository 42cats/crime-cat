-- Migration: V1.1.0_011_update_game_themes_permit_like_comment.sql
-- Description: 게임 테마에 좋아요 / 댓글 허용 컬럼 추가
-- Created: 2025-05-15 16:46:17

USE ${DB_DISCORD};

SET @table_exist = (SELECT COUNT(*) FROM information_schema.tables 
                   WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_themes');

SET @recommendation_enabled_exist = IF(@table_exist > 0, (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE `TABLE_SCHEMA` = '${DB_DISCORD}'
        AND `TABLE_NAME` = 'game_themes'
        AND `COLUMN_NAME` = 'recommendation_enabled'
), 0);

SET @comment_enabled_exist = IF(@table_exist > 0, (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE `TABLE_SCHEMA` = '${DB_DISCORD}'
        AND `TABLE_NAME` = 'game_themes'
        AND `COLUMN_NAME` = 'comment_enabled'
), 0);

SET @sql = IF(@table_exist > 0 AND @recommendation_enabled_exist = 0 AND @comment_enabled_exist = 0, 
'ALTER TABLE `game_themes`
  ADD COLUMN `recommendation_enabled` BOOLEAN NOT NULL DEFAULT TRUE COMMENT "좋아요 허용",
  ADD COLUMN `comment_enabled` BOOLEAN NOT NULL DEFAULT TRUE COMMENT "댓글 허용"',
'SELECT "game_themes 테이블이 존재하지 않거나 이미 열이 업데이트 되었습니다." AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
