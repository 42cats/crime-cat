-- V1.1.0_010_add_post_tables_.sql
-- Description: 포스트 테이블 및 포스트 코맨트 테이블 생성
-- Created: 2025-05-12 14:35:00

USE ${DB_DISCORD};

-- 1) posts 테이블
CREATE TABLE IF NOT EXISTS `posts` (
  `id`             BINARY(16)     PRIMARY KEY,
  `subject`        VARCHAR(200)   NOT NULL,
  `content`        TEXT           NOT NULL,
  `user`           BINARY(16)     NOT NULL,
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME       NULL DEFAULT NULL
  `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
  `views`          INT            NOT NULL DEFAULT 0
  `secret`         BOOLEAN        NOT NULL DEFAULT FALSE,
  `post_type`      VARCHAR(32)    NOT NULL,
  `board_type`     VARCHAR(32)    NOT NULL,
  CONSTRAINT `fk_posts_author`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 2) posts 인덱스
ALTER TABLE `posts`
  ADD INDEX IF NOT EXISTS `idx_posts_user`        (`user`),
  ADD INDEX IF NOT EXISTS `idx_posts_created_at` (`created_at` DESC);

-- 3) post_likes 테이블
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id`          BINARY(16) PRIMARY KEY,
  `user`        BINARY(16) NOT NULL,
  `post`        BINARY(16) NOT NULL,
  `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_post_likes_user`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_post_likes_post`
    FOREIGN KEY (`post`)
    REFERENCES `posts`(`id`)
    ON DELETE CASCADE,
  UNIQUE KEY `uk_post_likes_user_post` (`user`, `post`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- 4) post_likes 인덱스
ALTER TABLE `post_likes`
  ADD INDEX IF NOT EXISTS `idx_post_likes_user`     (`user`),
  ADD INDEX IF NOT EXISTS `idx_post_likes_post`     (`post`);

-- 5) post_comments 테이블
CREATE TABLE IF NOT EXISTS `post_comments` (
    `id`             BINARY(16)     PRIMARY KEY,
    `content`        TEXT           NOT NULL,
    `user`           BINARY(16)     NOT NULL,
    `post`           BINARY(16)     NOT NULL,
    `parent`         BINARY(16)     NOT NULL,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       NULL DEFAULT NULL
    `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
    `secret`         BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_post_comments_author`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    CONSTRAINT `fk_post_comments_post`
    FOREIGN KEY (`post`)
    REFERENCES `posts`(`id`)
    CONSTRAINT `fk_post_comments_parent`
    FOREIGN KEY (`parent`)
    REFERENCES `post_comments`(`id`)
    ON DELETE RESTRICT,
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 2) post_comments 인덱스
ALTER TABLE `post_comments`
    ADD INDEX IF NOT EXISTS `idx_post_comments_user`    (`user`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_post`    (`post`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_parent`  (`parent`),
    ADD INDEX IF NOT EXISTS `idx_posts_created_at` (`created_at` DESC);

-- 3) post_comment_likes 테이블
CREATE TABLE IF NOT EXISTS `post_comment_likes` (
    `id`          BINARY(16) PRIMARY KEY,
    `user`        BINARY(16) NOT NULL,
    `comment`     BINARY(16) NOT NULL,
    `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_post_comment_likes_user`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
    CONSTRAINT `fk_post_comment_likes_post`
    FOREIGN KEY (`comment`)
    REFERENCES `comments`(`id`)
    ON DELETE CASCADE,
    UNIQUE KEY `uk_post_comment_likes_user_comment` (`user`, `comment`)
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 4) post_likes 인덱스
ALTER TABLE `post_comment_likes`
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_user`     (`user`),
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_comment`  (`comment`);
