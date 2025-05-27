-- =========================================
-- Migration: V1.3.2_000_migrate_game_themes_author_to_web_users
-- Description: game_themes.author 값을 users.id에서 web_users.id로 변경
-- Created: 2025-01-27
-- Note: 이 마이그레이션은 V1.3.2_002와 V1.3.2_003보다 먼저 실행되어야 함
-- =========================================

USE ${DB_DISCORD};

-- 1. 현재 상황 진단
SELECT '===== Author Migration Start =====' as status;

-- 전체 game_themes 레코드 수
SELECT COUNT(*) as 'Total game_themes records' FROM game_themes;

-- game_themes.author가 users.id를 참조하는 경우 확인
SELECT COUNT(*) as 'Records where author = users.id'
FROM game_themes gt
INNER JOIN users u ON gt.author = u.id;

-- 이미 web_users.id를 직접 참조하는 경우
SELECT COUNT(*) as 'Records already pointing to web_users'
FROM game_themes gt
INNER JOIN web_users wu ON gt.author = wu.id
LEFT JOIN users u ON gt.author = u.id
WHERE u.id IS NULL;

-- 2. 백업 테이블 생성
CREATE TABLE IF NOT EXISTS game_themes_author_migration_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_theme_id binary(16) NOT NULL,
    game_theme_title varchar(255),
    old_author_value binary(16) NOT NULL,
    new_author_value binary(16),
    user_discord_snowflake varchar(50),
    migration_type varchar(50),
    migrated_at datetime DEFAULT current_timestamp(),
    KEY idx_game_theme_id (game_theme_id),
    KEY idx_old_author (old_author_value),
    KEY idx_new_author (new_author_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='game_themes author 마이그레이션 로그';

-- 3. 시스템 사용자 생성 (없는 경우)
SET @system_user_id = UNHEX(REPLACE('00000000-0000-0000-0000-000000000001', '-', ''));
SET @system_user_exists = (
    SELECT COUNT(*) 
    FROM web_users 
    WHERE id = @system_user_id
);

SET @sql = IF(@system_user_exists = 0,
    'INSERT INTO web_users (id, nickname, email, login_method, role, is_active, email_verified, is_banned, created_at) 
     VALUES (
        UNHEX(REPLACE("00000000-0000-0000-0000-000000000001", "-", "")), 
        "시스템", 
        "system@crimecat.com", 
        "LOCAL", 
        "USER", 
        1, 
        1, 
        0, 
        NOW()
     )',
    'SELECT "System user already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 마이그레이션 전 데이터 백업
-- Case 1: users.web_user_id가 있는 경우
INSERT INTO game_themes_author_migration_log 
    (game_theme_id, game_theme_title, old_author_value, new_author_value, user_discord_snowflake, migration_type)
SELECT 
    gt.id,
    gt.title,
    gt.author,
    u.web_user_id,
    u.discord_snowflake,
    'users_to_web_users_direct'
FROM game_themes gt
INNER JOIN users u ON gt.author = u.id
WHERE u.web_user_id IS NOT NULL;

-- Case 2: discord_snowflake로 web_users 찾을 수 있는 경우
INSERT INTO game_themes_author_migration_log 
    (game_theme_id, game_theme_title, old_author_value, new_author_value, user_discord_snowflake, migration_type)
SELECT 
    gt.id,
    gt.title,
    gt.author,
    wu.id,
    u.discord_snowflake,
    'users_to_web_users_via_discord'
FROM game_themes gt
INNER JOIN users u ON gt.author = u.id
INNER JOIN web_users wu ON u.discord_snowflake = wu.discord_user_id
WHERE u.web_user_id IS NULL;

-- Case 3: 매핑할 수 없는 경우 (시스템 사용자로)
INSERT INTO game_themes_author_migration_log 
    (game_theme_id, game_theme_title, old_author_value, new_author_value, user_discord_snowflake, migration_type)
SELECT 
    gt.id,
    gt.title,
    gt.author,
    @system_user_id,
    u.discord_snowflake,
    'users_to_system_user'
FROM game_themes gt
INNER JOIN users u ON gt.author = u.id
LEFT JOIN web_users wu1 ON u.web_user_id = wu1.id
LEFT JOIN web_users wu2 ON u.discord_snowflake = wu2.discord_user_id
WHERE wu1.id IS NULL AND wu2.id IS NULL;

-- Case 4: 이미 web_users를 직접 참조하는 경우
INSERT INTO game_themes_author_migration_log 
    (game_theme_id, game_theme_title, old_author_value, new_author_value, user_discord_snowflake, migration_type)
SELECT 
    gt.id,
    gt.title,
    gt.author,
    gt.author,
    wu.discord_user_id,
    'already_web_users'
FROM game_themes gt
INNER JOIN web_users wu ON gt.author = wu.id
LEFT JOIN users u ON gt.author = u.id
WHERE u.id IS NULL;

-- 5. 실제 마이그레이션 수행
-- 5-1. users.web_user_id가 있는 경우
UPDATE game_themes gt
INNER JOIN users u ON gt.author = u.id
SET gt.author = u.web_user_id
WHERE u.web_user_id IS NOT NULL;

SELECT CONCAT('Updated ', ROW_COUNT(), ' records using users.web_user_id') as step1_result;

-- 5-2. discord_snowflake로 매핑
UPDATE game_themes gt
INNER JOIN users u ON gt.author = u.id
INNER JOIN web_users wu ON u.discord_snowflake = wu.discord_user_id
SET gt.author = wu.id
WHERE u.web_user_id IS NULL;

SELECT CONCAT('Updated ', ROW_COUNT(), ' records using discord_snowflake mapping') as step2_result;

-- 5-3. 매핑할 수 없는 레코드는 시스템 사용자로
UPDATE game_themes gt
INNER JOIN users u ON gt.author = u.id
LEFT JOIN web_users wu ON gt.author = wu.id
SET gt.author = @system_user_id
WHERE wu.id IS NULL;

SELECT CONCAT('Updated ', ROW_COUNT(), ' records to system user') as step3_result;

-- 6. 최종 검증
SELECT '===== Migration Results =====' as status;

-- 마이그레이션 타입별 결과
SELECT 
    migration_type,
    COUNT(*) as record_count
FROM game_themes_author_migration_log
GROUP BY migration_type
ORDER BY record_count DESC;

-- 최종 상태 확인
SELECT COUNT(*) as 'Successfully migrated to web_users'
FROM game_themes gt
INNER JOIN web_users wu ON gt.author = wu.id;

SELECT COUNT(*) as 'Failed migrations (should be 0)'
FROM game_themes gt
LEFT JOIN web_users wu ON gt.author = wu.id
WHERE wu.id IS NULL;

-- 샘플 데이터 확인
SELECT 
    'Sample migrated records' as description,
    HEX(l.game_theme_id) as game_theme_id,
    l.game_theme_title,
    HEX(l.old_author_value) as old_author,
    HEX(l.new_author_value) as new_author,
    l.migration_type
FROM game_themes_author_migration_log l
LIMIT 10;

SELECT '===== Author Migration Completed =====' as status;
SELECT 'Check game_themes_author_migration_log table for full migration details' as note;