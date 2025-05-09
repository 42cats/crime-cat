-- Migration: V1.1.0_008_change_gamehistory_table_discord_user_to_user.sql
-- Description: gamehistory 테이블의 discorduser 참조를 user 참조로 수정
-- Created: 2025-05-09 12:00:00

USE ${DB_DISCORD};

-- 마이그레이션 시작
START TRANSACTION;

-- 외래 키 제약 조건 비활성화
SET FOREIGN_KEY_CHECKS=0;

-- 1. user_id 컬럼이 존재하는지 확인하고 없으면 추가
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'game_histories' AND column_name = 'user_id';

SET @addUserIdColumn = CONCAT('ALTER TABLE game_histories ADD COLUMN user_id binary(16) NULL COMMENT ''User ID 참조''');

-- user_id 컬럼이 없으면 추가
SET @stmt = IF(@columnExists = 0, @addUserIdColumn, 'SELECT ''user_id column already exists''');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 기존 데이터 마이그레이션: discord_users.snowflake를 통해 users 테이블에서 해당하는 ID를 찾아 user_id에 설정
-- 이미 업데이트되지 않은 레코드만 처리
SET @dataUpdateExists = 0;
SELECT COUNT(*) INTO @dataUpdateExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name IN ('game_histories', 'discord_users', 'users');

SET @dataUpdateQuery = IF(@dataUpdateExists = 3, '
UPDATE game_histories gh
JOIN discord_users du ON gh.user_snowflake = du.snowflake
JOIN users u ON du.id = u.discord_user_id
SET gh.user_id = u.id
WHERE gh.user_id IS NULL
', 'SELECT "필요한 테이블이 모두 존재하지 않습니다." AS message');

PREPARE stmt FROM @dataUpdateQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. user_id 컬럼에 대한 외래 키가 이미 존재하는지 확인하고 없으면 추가
SET @fkExists = 0;
SELECT COUNT(*) INTO @fkExists FROM information_schema.table_constraints 
WHERE table_schema = DATABASE() AND table_name = 'game_histories' 
AND constraint_name = 'fk_game_histories_users';

-- 테이블이 존재하는지 확인
SET @tablesExist = 0;
SELECT COUNT(*) INTO @tablesExist FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name IN ('game_histories', 'users');

-- 외래 키가 없으면 추가
SET @addForeignKeyStmt = IF(@tablesExist = 2, 
    'ALTER TABLE game_histories ADD CONSTRAINT fk_game_histories_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT ''Required tables do not exist''');
SET @stmt = IF(@fkExists = 0, @addForeignKeyStmt, 'SELECT ''FK already exists''');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 기존 외래 키를 제거하기 전에 확인
SET @oldFkExists = 0;
SELECT COUNT(*) INTO @oldFkExists FROM information_schema.table_constraints 
WHERE table_schema = DATABASE() AND table_name = 'game_histories' 
AND constraint_name = 'fk_game_histories_discord_users';

-- 테이블이 존재하는지 확인
SET @tableExists = 0;
SELECT COUNT(*) INTO @tableExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'game_histories';

-- 기존 FK가 있으면 제거
SET @dropForeignKeyStmt = IF(@tableExists > 0, 
    'ALTER TABLE game_histories DROP FOREIGN KEY fk_game_histories_discord_users',
    'SELECT ''Table does not exist''');
SET @stmt = IF(@oldFkExists > 0, @dropForeignKeyStmt, 'SELECT ''Old FK does not exist''');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 인덱스 수정: user_id를 포함하는 새 인덱스 생성
SET @userIdIndexExists = 0;
SELECT COUNT(*) INTO @userIdIndexExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'game_histories' 
AND index_name = 'idx_game_histories_user_id_created_at';

-- 테이블이 존재하는지 확인
SET @tableExists = 0;
SELECT COUNT(*) INTO @tableExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'game_histories';

-- 새 인덱스가 없으면 추가
SET @addUserIdIndexStmt = IF(@tableExists > 0, 
    'CREATE INDEX idx_game_histories_user_id_created_at ON game_histories (user_id, created_at DESC)',
    'SELECT ''Table does not exist''');
SET @stmt = IF(@userIdIndexExists = 0, @addUserIdIndexStmt, 'SELECT ''User ID index already exists''');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. 모든 데이터가 마이그레이션되었으면 user_snowflake 컬럼을 제거
-- 중요: 이 부분은 데이터 검증 후 주석 해제하여 실행
-- ALTER TABLE game_histories DROP COLUMN user_snowflake;

-- 외래 키 제약 조건 다시 활성화
SET FOREIGN_KEY_CHECKS=1;

-- 작업 완료
COMMIT;