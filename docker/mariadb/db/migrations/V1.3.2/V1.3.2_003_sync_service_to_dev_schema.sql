-- =========================================
-- V1.3.2_003: 서비스 DB를 개발 DB 스키마에 맞추기 위한 마이그레이션
-- 작성일: 2025-05-26
-- 목적: 서비스 DB와 개발 DB 간의 스키마 차이점 해결
-- =========================================

USE ${DB_DISCORD};

-- 1. game_themes 테이블: author 외래키 제약조건 추가
-- 먼저 데이터 무결성 체크
SELECT 'Checking game_themes author references...' as status;
SELECT COUNT(*) as invalid_authors
FROM game_themes gt
LEFT JOIN web_users wu ON gt.author = wu.id
WHERE wu.id IS NULL AND gt.author IS NOT NULL;

-- 기존 fk_author 제약조건이 있는지 확인
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

-- fk_game_themes_author 제약조건이 있는지도 확인 (중복 체크)
SET @new_constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_game_themes_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

-- 외래키 추가 (둘 다 없고 데이터가 유효한 경우만)
SET @invalid_authors = (
    SELECT COUNT(*)
    FROM game_themes gt
    LEFT JOIN web_users wu ON gt.author = wu.id
    WHERE wu.id IS NULL AND gt.author IS NOT NULL
);

SET @sql = IF(@constraint_exists = 0 AND @new_constraint_exists = 0 AND @invalid_authors = 0,
    'ALTER TABLE `game_themes` ADD CONSTRAINT `fk_author` FOREIGN KEY (`author`) REFERENCES `web_users` (`id`) ON DELETE CASCADE',
    IF(@invalid_authors > 0,
        CONCAT('SELECT "Cannot add foreign key: ', @invalid_authors, ' invalid author references exist. Run V1.3.2_001_fix_game_themes_data_integrity.sql first" as message'),
        IF(@constraint_exists > 0,
            'SELECT "fk_author constraint already exists" as message',
            'SELECT "fk_game_themes_author constraint already exists" as message'
        )
    )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. crimescene_themes 테이블: 외래키 제약조건 수정
-- 기존 제약조건이 존재하는지 확인
SET @fk_crimescene_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crimescene_themes'
    AND CONSTRAINT_NAME = 'fk_crimescene_game_theme'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_crimescene_exists > 0,
    'ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_crimescene_game_theme`',
    'SELECT "fk_crimescene_game_theme does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- fk_maker_teams_id 제약조건 확인 및 삭제
SET @fk_maker_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crimescene_themes'
    AND CONSTRAINT_NAME = 'fk_maker_teams_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_maker_exists > 0,
    'ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_maker_teams_id`',
    'SELECT "fk_maker_teams_id does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 새로운 제약조건 추가
SET @fk_id_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crimescene_themes'
    AND CONSTRAINT_NAME = 'fk_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_id_exists = 0,
    'ALTER TABLE `crimescene_themes` ADD CONSTRAINT `fk_id` FOREIGN KEY (`id`) REFERENCES `game_themes` (`id`) ON DELETE CASCADE',
    'SELECT "fk_id already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- fk_maker_teams_id 재생성
SET @fk_maker_new_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'crimescene_themes'
    AND CONSTRAINT_NAME = 'fk_maker_teams_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_maker_new_exists = 0,
    'ALTER TABLE `crimescene_themes` ADD CONSTRAINT `fk_maker_teams_id` FOREIGN KEY (`maker_teams_id`) REFERENCES `maker_teams` (`id`) ON DELETE SET NULL',
    'SELECT "fk_maker_teams_id already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. maker_team_members 테이블: 외래키 제약조건에서 ON DELETE CASCADE 제거
SET @fk_web_user_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'maker_team_members'
    AND CONSTRAINT_NAME = 'fk_web_user_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_web_user_exists > 0,
    'ALTER TABLE `maker_team_members` DROP FOREIGN KEY `fk_web_user_id`',
    'SELECT "fk_web_user_id does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 새로운 제약조건 추가 (CASCADE 없이)
SET @fk_web_user_new = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'maker_team_members'
    AND CONSTRAINT_NAME = 'fk_web_user_id'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_web_user_new = 0,
    'ALTER TABLE `maker_team_members` ADD CONSTRAINT `fk_web_user_id` FOREIGN KEY (`web_user_id`) REFERENCES `web_users` (`id`)',
    'SELECT "fk_web_user_id already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. user_post_comments 테이블: idx_user_post_comments_post_parent 인덱스 삭제
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_post_comments'
    AND INDEX_NAME = 'idx_user_post_comments_post_parent'
);

SET @sql = IF(@index_exists > 0,
    'ALTER TABLE `user_post_comments` DROP INDEX `idx_user_post_comments_post_parent`',
    'SELECT "idx_user_post_comments_post_parent index does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'V1.3.2_003 sync service to dev schema completed' as result;