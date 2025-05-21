-- V1.2.4_001_hashtag_and_saved_post_tables.sql
-- 트랜잭션 시작
START TRANSACTION;

-- 1. 해시태그 테이블 생성
SET @sql_hashtags = '
CREATE TABLE IF NOT EXISTS `hashtags` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 해시태그 ID'',
    `name` VARCHAR(255) NOT NULL COMMENT ''해시태그 이름'',
    `use_count` INT DEFAULT 0 COMMENT ''해시태그 사용 횟수'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''해시태그 생성 시간'',
    `last_used_at` DATETIME(6) DEFAULT NULL COMMENT ''해시태그 마지막 사용 시간'',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_hashtags_name` (`name`),
    KEY `idx_hashtags_use_count` (`use_count` DESC) COMMENT ''인기 해시태그 검색용 인덱스''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 2. 게시물-해시태그 연결 테이블
SET @sql_post_hashtags = '
CREATE TABLE IF NOT EXISTS `post_hashtags` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 연결 ID'',
    `post_id` BINARY(16) NOT NULL COMMENT ''게시물 ID'',
    `hashtag_id` BINARY(16) NOT NULL COMMENT ''해시태그 ID'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''연결 생성 시간'',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_post_hashtags_post_hashtag` (`post_id`, `hashtag_id`),
    KEY `idx_post_hashtags_post_id` (`post_id`),
    KEY `idx_post_hashtags_hashtag_id` (`hashtag_id`),
    CONSTRAINT `fk_post_hashtags_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_post_hashtags_hashtag` FOREIGN KEY (`hashtag_id`) REFERENCES `hashtags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 3. 저장된 게시물 테이블
SET @sql_saved_posts = '
CREATE TABLE IF NOT EXISTS `saved_posts` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 저장 ID'',
    `user_id` BINARY(16) NOT NULL COMMENT ''사용자 ID'',
    `post_id` BINARY(16) NOT NULL COMMENT ''게시물 ID'',
    `collection_name` VARCHAR(255) DEFAULT NULL COMMENT ''컬렉션 이름'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''저장 시간'',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_saved_posts_user_post` (`user_id`, `post_id`),
    KEY `idx_saved_posts_user_id` (`user_id`),
    KEY `idx_saved_posts_post_id` (`post_id`),
    KEY `idx_saved_posts_collection` (`user_id`, `collection_name`),
    CONSTRAINT `fk_saved_posts_user` FOREIGN KEY (`user_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_saved_posts_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 4. UserPost 테이블에 새 컬럼 추가
SET @sql_alter_user_posts = '
ALTER TABLE `user_posts`
ADD COLUMN `location_name` VARCHAR(255) DEFAULT NULL COMMENT ''위치 이름'' AFTER `is_followers_only`,
ADD COLUMN `latitude` DOUBLE DEFAULT NULL COMMENT ''위도'' AFTER `location_name`,
ADD COLUMN `longitude` DOUBLE DEFAULT NULL COMMENT ''경도'' AFTER `latitude`,
ADD COLUMN `view_count` INT NOT NULL DEFAULT 0 COMMENT ''조회수'' AFTER `longitude`,
ADD COLUMN `popularity_score` DOUBLE NOT NULL DEFAULT 0.0 COMMENT ''인기도 점수'' AFTER `view_count`,
ADD KEY `idx_user_posts_popularity` (`popularity_score` DESC) COMMENT ''인기 게시물 검색용 인덱스'',
ADD KEY `idx_user_posts_location` (`latitude`, `longitude`) COMMENT ''위치 기반 검색용 인덱스'';
';

-- 실행 및 PREPARE
PREPARE stmt_hashtags FROM @sql_hashtags;
EXECUTE stmt_hashtags;
DEALLOCATE PREPARE stmt_hashtags;

PREPARE stmt_post_hashtags FROM @sql_post_hashtags;
EXECUTE stmt_post_hashtags;
DEALLOCATE PREPARE stmt_post_hashtags;

PREPARE stmt_saved_posts FROM @sql_saved_posts;
EXECUTE stmt_saved_posts;
DEALLOCATE PREPARE stmt_saved_posts;

PREPARE stmt_alter_user_posts FROM @sql_alter_user_posts;
EXECUTE stmt_alter_user_posts;
DEALLOCATE PREPARE stmt_alter_user_posts;

-- 트랜잭션 커밋
COMMIT;

-- 테이블 존재 확인
SHOW TABLES LIKE 'hashtags';
SHOW TABLES LIKE 'post_hashtags';
SHOW TABLES LIKE 'saved_posts';
SHOW COLUMNS FROM `user_posts` LIKE 'popularity_score';
