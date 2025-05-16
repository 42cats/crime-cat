-- V1.2.1_002_remove_user_snowflake_from_game_histories.sql
-- Description: game_histories 테이블에서 user_snowflake 컬럼 및 인덱스 제거
-- Created: 2025-05-16 17:10:00

USE ${DB_DISCORD};
START TRANSACTION;

-- 1) 인덱스 idx_game_histories_user_created_at가 있으면 제거
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `game_histories` DROP INDEX `idx_game_histories_user_created_at`;',
    'SELECT "no idx_game_histories_user_created_at";'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'game_histories'
    AND index_name   = 'idx_game_histories_user_created_at'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) 컬럼 user_snowflake가 있으면 제거
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `game_histories` DROP COLUMN `user_snowflake`;',
    'SELECT "no user_snowflake column";'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name   = 'game_histories'
    AND column_name  = 'user_snowflake'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

COMMIT;
