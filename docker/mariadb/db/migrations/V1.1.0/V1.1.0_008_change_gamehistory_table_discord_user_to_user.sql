-- Migration: V1.1.0_008_change_gamehistory_table_discord_user_to_user.sql
-- Description: gamehistory 테이블의 discorduser 참조를 user 참조로 수정
-- Created: 2025-05-09 12:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 외래 키 제약 조건 비활성화
SET FOREIGN_KEY_CHECKS=0;

-- 1. user_id 컬럼이 존재하는지 확인하고 없으면 추가
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists
  FROM information_schema.columns 
 WHERE table_schema = DATABASE()
   AND table_name = 'game_histories'
   AND column_name = 'user_id';

SET @addUserIdColumn = '
  ALTER TABLE game_histories
    ADD COLUMN user_id BINARY(16) NULL COMMENT ''User ID 참조''
';

SET @stmt = IF(
  @columnExists = 0,
  @addUserIdColumn,
  'SELECT ''user_id column already exists'''
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 기존 데이터 마이그레이션
SET @dataUpdateExists = 0;
SELECT COUNT(*) INTO @dataUpdateExists
  FROM information_schema.tables 
 WHERE table_schema = DATABASE()
   AND table_name IN ('game_histories','discord_users','users');

SET @dataUpdateQuery = IF(
  @dataUpdateExists = 3,
  '
    UPDATE game_histories gh
      JOIN discord_users du ON gh.user_snowflake = du.snowflake
      JOIN users u           ON du.id = u.discord_user_id
    SET gh.user_id = u.id
    WHERE gh.user_id IS NULL
  ',
  'SELECT ''필요한 테이블이 모두 존재하지 않습니다.'' AS message'
);
PREPARE stmt FROM @dataUpdateQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. user_id 외래키 추가
SET @fkExists = 0;
SELECT COUNT(*) INTO @fkExists
  FROM information_schema.table_constraints
 WHERE table_schema    = DATABASE()
   AND table_name      = 'game_histories'
   AND constraint_name = 'fk_game_histories_users';

SET @tablesExist = 0;
SELECT COUNT(*) INTO @tablesExist
  FROM information_schema.tables
 WHERE table_schema = DATABASE()
   AND table_name   IN ('game_histories','users');

SET @addForeignKeyStmt = IF(
  @tablesExist = 2,
  '
    ALTER TABLE game_histories
      ADD CONSTRAINT fk_game_histories_users
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ',
  'SELECT ''Required tables do not exist'''
);

SET @stmt = IF(
  @fkExists = 0,
  @addForeignKeyStmt,
  'SELECT ''FK already exists'''
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 기존 discord_users 외래키 제거
SET @oldFkExists = 0;
SELECT COUNT(*) INTO @oldFkExists
  FROM information_schema.table_constraints
 WHERE table_schema    = DATABASE()
   AND table_name      = 'game_histories'
   AND constraint_name = 'fk_game_histories_discord_users';

SET @dropForeignKeyStmt = '
  ALTER TABLE game_histories
    DROP FOREIGN KEY fk_game_histories_discord_users
';
SET @stmt = IF(
  @oldFkExists > 0,
  @dropForeignKeyStmt,
  'SELECT ''Old FK does not exist'''
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. user_id 인덱스 생성
SET @userIdIndexExists = 0;
SELECT COUNT(*) INTO @userIdIndexExists
  FROM information_schema.statistics
 WHERE table_schema = DATABASE()
   AND table_name   = 'game_histories'
   AND index_name   = 'idx_game_histories_user_id_created_at';

SET @addUserIdIndexStmt = '
  CREATE INDEX idx_game_histories_user_id_created_at
    ON game_histories (user_id, created_at DESC)
';
SET @stmt = IF(
  @userIdIndexExists = 0,
  @addUserIdIndexStmt,
  'SELECT ''User ID index already exists'''
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. (선택) user_snowflake 컬럼 제거
-- ALTER TABLE game_histories DROP COLUMN user_snowflake;

-- 7. user_snowflake 컬럼을 NULL 허용으로 변경
SET @modifySnowflakeStmt = '
  ALTER TABLE game_histories
    MODIFY COLUMN user_snowflake VARCHAR(50) NULL COMMENT ''Discord user snowflake''
';
PREPARE stmt FROM @modifySnowflakeStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 외래 키 제약 조건 다시 활성화
SET FOREIGN_KEY_CHECKS=1;

COMMIT;
