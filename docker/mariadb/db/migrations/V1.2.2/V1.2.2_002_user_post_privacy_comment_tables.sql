-- V1.2.2_002_user_post_privacy_comment_tables.sql
-- 트랜잭션 시작
START TRANSACTION;

-- user_posts 테이블에 비밀글, 팔로워 공개 컬럼 추가
SET @sql_alter_user_posts = '
ALTER TABLE `user_posts` 
ADD COLUMN `is_private` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''비밀글 여부 (1:비밀글, 0:공개)'',
ADD COLUMN `is_followers_only` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''팔로워 공개 여부 (1:팔로워만, 0:전체)'';
';

-- user_post_comments 테이블 생성 쿼리 설정
SET @sql_user_post_comments = '
CREATE TABLE IF NOT EXISTS `user_post_comments` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 댓글 ID'',
    `post_id` BINARY(16) NOT NULL COMMENT ''게시글 ID'',
    `author_id` BINARY(16) NOT NULL COMMENT ''작성자 ID'',
    `parent_id` BINARY(16) DEFAULT NULL COMMENT ''부모 댓글 ID (대댓글인 경우)'',
    `content` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT ''댓글 내용 최대 1000자'',
    `is_private` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''비밀 댓글 여부 (1:비밀댓글, 0:공개)'',
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''삭제 여부 (소프트 딜리트, 1:삭제됨, 0:정상)'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''작성 시각'',
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT ''수정 시각'',
    PRIMARY KEY (`id`),
    KEY `idx_user_post_comments_post_id` (`post_id`),
    KEY `idx_user_post_comments_author_id` (`author_id`),
    KEY `idx_user_post_comments_parent_id` (`parent_id`),
    CONSTRAINT `fk_user_post_comments_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_post_comments_author` FOREIGN KEY (`author_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_post_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `user_post_comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 실행 및 PREPARE
PREPARE stmt_alter_user_posts FROM @sql_alter_user_posts;
EXECUTE stmt_alter_user_posts;
DEALLOCATE PREPARE stmt_alter_user_posts;

PREPARE stmt_user_post_comments FROM @sql_user_post_comments;
EXECUTE stmt_user_post_comments;
DEALLOCATE PREPARE stmt_user_post_comments;

-- 테이블 변경 확인
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS 
WHERE 
    TABLE_NAME = 'user_posts' 
    AND COLUMN_NAME IN ('is_private', 'is_followers_only');

-- 트랜잭션 커밋
COMMIT;

-- 테이블 존재 확인
SHOW TABLES LIKE 'user_posts';
SHOW TABLES LIKE 'user_post_comments';