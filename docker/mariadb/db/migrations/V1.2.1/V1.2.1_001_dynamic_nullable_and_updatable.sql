-- V1.2.1_001_dynamic_nullable_and_updatable.sql
USE `${DB_DISCORD}`;

START TRANSACTION;

-- 1) 기존 외래키 제거를 위한 동적 SQL 준비
SET @sql = '
  ALTER TABLE `game_histories`
    DROP FOREIGN KEY `fk_game_histories_guilds`
';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) 컬럼을 NULL 허용으로 변경하는 동적 SQL 준비
SET @sql = '
  ALTER TABLE `game_histories`
    MODIFY COLUMN `guild_snowflake` VARCHAR(50) NULL COMMENT ''디스코드 guild snowflake''
';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) 외래키 재생성 (ON DELETE CASCADE, ON UPDATE CASCADE)
SET @sql = '
  ALTER TABLE `game_histories`
    ADD CONSTRAINT `fk_game_histories_guilds`
      FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
      ON DELETE CASCADE
      ON UPDATE CASCADE
';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
