-- V1.1.0_007_add_comment_tables_fixed.sql
-- Description: 코멘트와 라이크 테이블 생성 (케이스 정정 버전)
-- Created: 2025-05-08 14:30:00

USE `${DB_DISCORD}`;

-- 1) comments 테이블
CREATE TABLE IF NOT EXISTS `comments` (
  `id`             BINARY(16)     PRIMARY KEY,
  `content`        TEXT           NOT NULL,
  `game_theme_id`  BINARY(16)     NOT NULL,
  `author_id`      BINARY(16)     NOT NULL,
  `parent_id`      BINARY(16)     NULL,
  `is_spoiler`     BOOLEAN        NOT NULL DEFAULT FALSE,
  `likes`          INT            NOT NULL DEFAULT 0,
  `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME       NULL DEFAULT NULL
                     ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_game_theme`
    FOREIGN KEY (`game_theme_id`)
    REFERENCES `game_themes`(`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_comments_author`
    FOREIGN KEY (`author_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_comments_parent`
    FOREIGN KEY (`parent_id`)
    REFERENCES `comments`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 2) comments 인덱스
ALTER TABLE `comments`
  ADD INDEX IF NOT EXISTS `idx_comments_game_theme_id`    (`game_theme_id`),
  ADD INDEX IF NOT EXISTS `idx_comments_author_id`        (`author_id`),
  ADD INDEX IF NOT EXISTS `idx_comments_parent_id`        (`parent_id`),
  ADD INDEX IF NOT EXISTS `idx_comments_theme_created_at` (`game_theme_id`, `created_at` DESC);

-- 3) comment_likes 테이블
CREATE TABLE IF NOT EXISTS `comment_likes` (
  `id`          BINARY(16) PRIMARY KEY,
  `user_id`     BINARY(16) NOT NULL,
  `comment_id`  BINARY(16) NOT NULL,
  `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comment_likes_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_comment_likes_comment`
    FOREIGN KEY (`comment_id`)
    REFERENCES `comments`(`id`)
    ON DELETE CASCADE,
  UNIQUE KEY `uk_comment_likes_user_comment` (`user_id`, `comment_id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 4) comment_likes 인덱스
ALTER TABLE `comment_likes`
  ADD INDEX IF NOT EXISTS `idx_comment_likes_user_id`    (`user_id`),
  ADD INDEX IF NOT EXISTS `idx_comment_likes_comment_id` (`comment_id`);
