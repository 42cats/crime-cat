-- V1.2.3_001_follow_table.sql
-- 트랜잭션 시작
START TRANSACTION;

-- follows 테이블 생성 쿼리 설정
SET @sql_follows = '
CREATE TABLE IF NOT EXISTS `follows` (
    `id` BINARY(16) NOT NULL COMMENT ''UUID 기반 팔로우 ID'',
    `follower_id` BINARY(16) NOT NULL COMMENT ''팔로우하는 사용자 ID'',
    `following_id` BINARY(16) NOT NULL COMMENT ''팔로우 당하는 사용자 ID'',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT ''팔로우 시작 시각'',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_follows_follower_following` (`follower_id`, `following_id`),
    KEY `idx_follows_follower_id` (`follower_id`),
    KEY `idx_follows_following_id` (`following_id`),
    CONSTRAINT `fk_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_follows_following` FOREIGN KEY (`following_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
';

-- 실행 및 PREPARE
PREPARE stmt_follows FROM @sql_follows;
EXECUTE stmt_follows;
DEALLOCATE PREPARE stmt_follows;

-- 트랜잭션 커밋
COMMIT;

-- 테이블 존재 확인
SHOW TABLES LIKE 'follows';
