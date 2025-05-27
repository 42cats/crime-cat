-- =========================================
-- Migration: V1.3.2_002_update_game_themes_author_reference
-- Description: game_themes 테이블의 author 참조를 users에서 web_users로 변경
-- Created: 2025-01-20
-- =========================================

USE ${DB_DISCORD};

-- 1. 기존 외래키 제약조건 확인 및 삭제
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@fk_exists > 0,
    'ALTER TABLE `game_themes` DROP FOREIGN KEY `fk_author`',
    'SELECT "Foreign key fk_author does not exist, skipping..." as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 새로운 외래키 제약조건 추가 전 기존 제약조건 확인
SET @new_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_game_themes_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@new_fk_exists = 0,
    'ALTER TABLE `game_themes` ADD CONSTRAINT `fk_game_themes_author` FOREIGN KEY (`author`) REFERENCES `web_users` (`id`) ON DELETE CASCADE',
    'SELECT "Foreign key fk_game_themes_author already exists, skipping..." as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 인덱스 확인 및 삭제
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND INDEX_NAME = 'fk_author'
);

SET @sql = IF(@idx_exists > 0,
    'ALTER TABLE `game_themes` DROP INDEX `fk_author`',
    'SELECT "Index fk_author does not exist, skipping..." as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 새 인덱스 추가
SET @new_idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND INDEX_NAME = 'idx_game_themes_author'
);

SET @sql = IF(@new_idx_exists = 0,
    'ALTER TABLE `game_themes` ADD INDEX `idx_game_themes_author` (`author`)',
    'SELECT "Index idx_game_themes_author already exists, skipping..." as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. 컬럼 코멘트 업데이트
ALTER TABLE `game_themes` 
MODIFY COLUMN `author` binary(16) NOT NULL COMMENT '작성자 (web_users.id 참조)';

SELECT 'Game themes author reference migration completed' as result;