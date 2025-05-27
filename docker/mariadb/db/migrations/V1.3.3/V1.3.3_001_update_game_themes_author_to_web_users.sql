-- =========================================
-- Migration: V1.3.3_001_update_game_themes_author_to_web_users
-- Description: game_themes 테이블의 author 컬럼을 users 참조에서 web_users 참조로 변경
-- Created: 2025-01-27
-- =========================================

USE ${DB_DISCORD};

-- 기존 외래키 제약 조건 제거 (존재하는 경우)
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql = IF(@constraint_exists > 0,
    'ALTER TABLE game_themes DROP FOREIGN KEY fk_author',
    'SELECT "Foreign key fk_author does not exist, skipping..."'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- fk_game_themes_author 제약 조건도 제거 (중복 제약이 있을 수 있음)
SET @constraint_exists2 = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'game_themes'
    AND CONSTRAINT_NAME = 'fk_game_themes_author'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @sql2 = IF(@constraint_exists2 > 0,
    'ALTER TABLE game_themes DROP FOREIGN KEY fk_game_themes_author',
    'SELECT "Foreign key fk_game_themes_author does not exist, skipping..."'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- author 컬럼의 코멘트 업데이트
ALTER TABLE game_themes 
MODIFY COLUMN `author` binary(16) NOT NULL COMMENT '작성자 (web_users.id 참조)';

-- type 컬럼에 코멘트 추가
ALTER TABLE game_themes 
MODIFY COLUMN `type` enum('CRIMESCENE','ESCAPE_ROOM','MURDER_MYSTERY','REALWORLD') NOT NULL COMMENT '테마 타입';

-- 새로운 외래키 제약 조건 추가 (web_users 테이블 참조)
-- 먼저 web_users 테이블이 존재하는지 확인
SET @table_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'web_users'
);

SET @sql3 = IF(@table_exists > 0,
    'ALTER TABLE game_themes ADD CONSTRAINT fk_game_themes_author FOREIGN KEY (`author`) REFERENCES `web_users` (`id`) ON DELETE CASCADE',
    'SELECT "web_users table does not exist, cannot create foreign key"'
);

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 마이그레이션 완료 확인
SELECT 'Migration V1.3.3_001_update_game_themes_author_to_web_users completed successfully' AS status;