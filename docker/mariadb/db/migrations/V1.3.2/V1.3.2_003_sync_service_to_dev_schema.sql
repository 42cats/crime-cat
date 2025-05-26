-- V1.3.2_003: 서비스 DB를 개발 DB 스키마에 맞추기 위한 마이그레이션
-- 작성일: 2025-05-26
-- 목적: 서비스 DB와 개발 DB 간의 스키마 차이점 해결

-- 1. game_themes 테이블: author 외래키 제약조건 추가
-- 기존 fk_author 제약조건이 있는지 확인하고 없으면 추가
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'game_themes' 
    AND CONSTRAINT_NAME = 'fk_author'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE `game_themes` ADD CONSTRAINT `fk_author` FOREIGN KEY (`author`) REFERENCES `web_users` (`id`) ON DELETE CASCADE',
    'SELECT "fk_author constraint already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. crimescene_themes 테이블: 외래키 제약조건 수정
-- fk_crimescene_game_theme를 fk_id로 변경하고 fk_maker_teams_id를 SET NULL로 변경

-- 기존 제약조건 삭제 후 재생성
ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_crimescene_game_theme`;
ALTER TABLE `crimescene_themes` DROP FOREIGN KEY `fk_maker_teams_id`;

-- 새로운 제약조건 추가
ALTER TABLE `crimescene_themes` 
ADD CONSTRAINT `fk_id` FOREIGN KEY (`id`) REFERENCES `game_themes` (`id`) ON DELETE CASCADE;

ALTER TABLE `crimescene_themes` 
ADD CONSTRAINT `fk_maker_teams_id` FOREIGN KEY (`maker_teams_id`) REFERENCES `maker_teams` (`id`) ON DELETE SET NULL;

-- 3. maker_team_members 테이블: 외래키 제약조건에서 ON DELETE CASCADE 제거
ALTER TABLE `maker_team_members` DROP FOREIGN KEY `fk_web_user_id`;
ALTER TABLE `maker_team_members` 
ADD CONSTRAINT `fk_web_user_id` FOREIGN KEY (`web_user_id`) REFERENCES `web_users` (`id`);

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