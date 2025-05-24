-- V1.2.5_003_add_escape_room_modifications.sql
-- This migration adds modifications for escape room system based on entity changes

-- 트랜잭션 시작
START TRANSACTION;

-- 1. escape_room_historys 테이블에 deleted_at 컬럼 추가 (소프트 삭제)
SET @sql_add_deleted_at_history = '
ALTER TABLE `escape_room_historys`
ADD COLUMN `deleted_at` DATETIME NULL COMMENT ''삭제 시간 (소프트 삭제)''
AFTER `updated_at`;
';

-- 실행 및 PREPARE
PREPARE stmt_add_deleted_at_history FROM @sql_add_deleted_at_history;
EXECUTE stmt_add_deleted_at_history;
DEALLOCATE PREPARE stmt_add_deleted_at_history;

-- 2. escape_room_comments 테이블에 deleted_at 컬럼 추가 (is_deleted 대체)
SET @sql_add_deleted_at_comments = '
ALTER TABLE `escape_room_comments`
ADD COLUMN `deleted_at` DATETIME NULL COMMENT ''삭제 시간 (소프트 삭제)''
AFTER `updated_at`;
';

-- 실행 및 PREPARE
PREPARE stmt_add_deleted_at_comments FROM @sql_add_deleted_at_comments;
EXECUTE stmt_add_deleted_at_comments;
DEALLOCATE PREPARE stmt_add_deleted_at_comments;

-- 3. 기존 is_deleted 컬럼을 deleted_at으로 마이그레이션
UPDATE `escape_room_comments`
SET `deleted_at` = `updated_at`
WHERE `is_deleted` = TRUE;

-- 4. is_deleted 컬럼 삭제
SET @sql_drop_is_deleted = '
ALTER TABLE `escape_room_comments`
DROP COLUMN `is_deleted`;
';

-- 실행 및 PREPARE
PREPARE stmt_drop_is_deleted FROM @sql_drop_is_deleted;
EXECUTE stmt_drop_is_deleted;
DEALLOCATE PREPARE stmt_drop_is_deleted;

-- 5. escape_room_historys와 user의 unique constraint 추가 (중복 플레이 기록 방지)
SET @sql_add_unique_history = '
ALTER TABLE `escape_room_historys`
ADD UNIQUE KEY `uk_escape_room_theme_user` (`escape_room_theme_id`, `web_user_id`, `deleted_at`);
';

-- 실행 및 PREPARE
PREPARE stmt_add_unique_history FROM @sql_add_unique_history;
EXECUTE stmt_add_unique_history;
DEALLOCATE PREPARE stmt_add_unique_history;

-- 6. 스포일러 댓글 조회를 위한 인덱스 추가
SET @sql_add_spoiler_index = '
CREATE INDEX `idx_escape_room_comment_spoiler` 
ON `escape_room_comments` (`escape_room_theme_id`, `is_spoiler`, `deleted_at`);
';

-- 실행 및 PREPARE
PREPARE stmt_add_spoiler_index FROM @sql_add_spoiler_index;
EXECUTE stmt_add_spoiler_index;
DEALLOCATE PREPARE stmt_add_spoiler_index;

-- 7. 소프트 삭제를 고려한 인덱스 추가
SET @sql_add_deleted_index_history = '
CREATE INDEX `idx_escape_room_historys_deleted` 
ON `escape_room_historys` (`deleted_at`);
';

-- 실행 및 PREPARE
PREPARE stmt_add_deleted_index_history FROM @sql_add_deleted_index_history;
EXECUTE stmt_add_deleted_index_history;
DEALLOCATE PREPARE stmt_add_deleted_index_history;

SET @sql_add_deleted_index_comments = '
CREATE INDEX `idx_escape_room_comment_deleted` 
ON `escape_room_comments` (`deleted_at`);
';

-- 실행 및 PREPARE
PREPARE stmt_add_deleted_index_comments FROM @sql_add_deleted_index_comments;
EXECUTE stmt_add_deleted_index_comments;
DEALLOCATE PREPARE stmt_add_deleted_index_comments;

-- 8. escape_room_comments 테이블에 likes_count 컬럼 추가
SET @sql_add_likes_count = '
ALTER TABLE `escape_room_comments`
ADD COLUMN `likes_count` INT NOT NULL DEFAULT 0 COMMENT ''좋아요 수''
AFTER `is_spoiler`;
';

-- 실행 및 PREPARE
PREPARE stmt_add_likes_count FROM @sql_add_likes_count;
EXECUTE stmt_add_likes_count;
DEALLOCATE PREPARE stmt_add_likes_count;

-- 9. escape_room_comment_likes 테이블 생성 (좋아요 기능)
CREATE TABLE IF NOT EXISTS `escape_room_comment_likes` (
    `id` BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `comment_id` BINARY(16) NOT NULL COMMENT '댓글 ID',
    `web_user_id` BINARY(16) NOT NULL COMMENT '좋아요한 사용자 ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_escape_room_comment_like_comment` FOREIGN KEY (`comment_id`) 
        REFERENCES `escape_room_comments`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_escape_room_comment_like_user` FOREIGN KEY (`web_user_id`) 
        REFERENCES `web_users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_escape_room_comment_like` (`comment_id`, `web_user_id`),
    INDEX `idx_escape_room_comment_like_comment` (`comment_id`),
    INDEX `idx_escape_room_comment_like_user` (`web_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 댓글 좋아요 테이블';

-- 트랜잭션 커밋
COMMIT;

-- 변경사항 확인
SHOW COLUMNS FROM `escape_room_historys` LIKE 'deleted_at';
SHOW COLUMNS FROM `escape_room_comments` LIKE 'deleted_at';
SHOW COLUMNS FROM `escape_room_comments` LIKE 'likes_count';
SHOW TABLES LIKE 'escape_room_comment_likes';