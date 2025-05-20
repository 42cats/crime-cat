-- V1.2.2_001_user_post_feat_tables.sql
-- 트랜잭션 시작
START TRANSACTION;

-- user_posts 테이블 생성 쿼리 설정
SET @sql_user_posts = '
CREATE TABLE IF NOT EXISTS `user_posts` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 게시글 ID'',
    `user_id` BINARY(16) NOT NULL COMMENT ''작성자 ID'',
    `content` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT ''본문 최대 500자'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''작성 시각'',
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT ''수정 시각'',
    PRIMARY KEY (`id`),
    KEY `idx_user_posts_user_id` (`user_id`),
    CONSTRAINT `fk_user_posts_user` FOREIGN KEY (`user_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- user_post_images 테이블 생성 쿼리 설정
SET @sql_user_post_images = '
CREATE TABLE IF NOT EXISTS `user_post_images` (
    `id` BINARY(16) NOT NULL COMMENT ''이미지 ID'',
    `post_id` BINARY(16) NOT NULL COMMENT ''게시글 ID'',
    `image_url` VARCHAR(500) NOT NULL COMMENT ''이미지 URL'',
    `sort_order` TINYINT NOT NULL DEFAULT 0 COMMENT ''최대 5장까지 순서 지정'',
    PRIMARY KEY (`id`),
    KEY `idx_user_post_images_post_id` (`post_id`),
    CONSTRAINT `fk_user_post_images_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- user_post_likes 테이블 생성 쿼리 설정
SET @sql_user_post_likes = '
CREATE TABLE IF NOT EXISTS `user_post_likes` (
    `id` BINARY(16) NOT NULL COMMENT ''좋아요 ID'',
    `user_id` BINARY(16) NOT NULL COMMENT ''좋아요 누른 사용자'',
    `post_id` BINARY(16) NOT NULL COMMENT ''대상 게시글'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_post_likes_user_post` (`user_id`, `post_id`),
    KEY `idx_user_post_likes_post_id` (`post_id`),
    CONSTRAINT `fk_user_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 실행 및 PREPARE
PREPARE stmt_user_posts FROM @sql_user_posts;
EXECUTE stmt_user_posts;
DEALLOCATE PREPARE stmt_user_posts;

PREPARE stmt_user_post_images FROM @sql_user_post_images;
EXECUTE stmt_user_post_images;
DEALLOCATE PREPARE stmt_user_post_images;

PREPARE stmt_user_post_likes FROM @sql_user_post_likes;
EXECUTE stmt_user_post_likes;
DEALLOCATE PREPARE stmt_user_post_likes;

-- 트랜잭션 커밋
COMMIT;

-- 테이블 존재 확인
SHOW TABLES LIKE 'user_posts';
SHOW TABLES LIKE 'user_post_images';
SHOW TABLES LIKE 'user_post_likes';
