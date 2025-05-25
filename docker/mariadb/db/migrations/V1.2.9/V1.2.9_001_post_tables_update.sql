-- Migration: V1.2.9_001_post_tables_update.sql
-- Created: 2025-05-25 
-- Update post tables structure

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS post_comment_likes;
DROP TABLE IF EXISTS board_post_likes;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS board_posts;

-- 1) board_posts 테이블
CREATE TABLE IF NOT EXISTS `board_posts` (
    `id`             BINARY(16)     PRIMARY KEY,
    `number`         INT            NOT NULL AUTO_INCREMENT UNIQUE,
    `subject`        VARCHAR(200)   NOT NULL,
    `content`        TEXT           NOT NULL,
    `author_id`      BINARY(16)     NOT NULL,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       NULL DEFAULT NULL,
    `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
    `views`          INT            NOT NULL DEFAULT 0,
    `likes`          INT            NOT NULL DEFAULT 0,
    `comments`       INT            NOT NULL DEFAULT 0,
    `is_secret`      BOOLEAN        NOT NULL DEFAULT FALSE,
    `post_type`      ENUM('GENERAL', 'QUESTION', 'PHOTO', 'SECRET', 'PROMOTION', 'RECRUIT', 'CRIME_SCENE', 'MURDER_MYSTERY', 'ESCAPE_ROOM', 'REAL_WORLD')   NOT NULL,
    `board_type`     ENUM('CHAT', 'QUESTION', 'NONE')  NOT NULL,
    `is_pinned`      BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_board_posts_author`
    FOREIGN KEY (`author_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 2) board_posts 인덱스
ALTER TABLE `board_posts`
    ADD INDEX IF NOT EXISTS `idx_board_posts_user`        (`author_id`),
    ADD INDEX IF NOT EXISTS `idx_board_posts_created_at` (`created_at` DESC);

-- 3) post_likes 테이블
CREATE TABLE IF NOT EXISTS `board_post_likes` (
    `id`          BINARY(16) PRIMARY KEY,
    `user_id`     BINARY(16) NOT NULL,
    `post_id`     BINARY(16) NOT NULL,
    `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_board_post_likes_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
    CONSTRAINT `fk_board_post_likes_post`
    FOREIGN KEY (`post_id`)
    REFERENCES `board_posts`(`id`)
    ON DELETE CASCADE,
    UNIQUE KEY `uk_board_post_likes_user_post` (`user_id`, `post_id`)
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 4) post_likes 인덱스
ALTER TABLE `board_post_likes`
    ADD INDEX IF NOT EXISTS `idx_board_post_likes_user`     (`user_id`),
    ADD INDEX IF NOT EXISTS `idx_board_post_likes_post`     (`post_id`);

-- 5) post_comments 테이블
CREATE TABLE IF NOT EXISTS `post_comments` (
    `id`             BINARY(16)     PRIMARY KEY,
    `content`        TEXT           NOT NULL,
    `author_id`      BINARY(16)     NOT NULL,
    `post_id`        BINARY(16)     NOT NULL,
    `parent_id`      BINARY(16)     DEFAULT NULL,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       NULL DEFAULT NULL,
    `likes`          INT            NOT NULL DEFAULT 0,
    `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
    `is_secret`      BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_post_comments_author`
    FOREIGN KEY (`author_id`)
    REFERENCES `web_users`(`id`),
    CONSTRAINT `fk_post_comments_post`
    FOREIGN KEY (`post_id`)
    REFERENCES `board_posts`(`id`),
    CONSTRAINT `fk_post_comments_parent`
    FOREIGN KEY (`parent_id`)
    REFERENCES `post_comments`(`id`)
    ON DELETE RESTRICT
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 2) post_comments 인덱스
ALTER TABLE `post_comments`
    ADD INDEX IF NOT EXISTS `idx_post_comments_user`    (`author_id`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_post`    (`post_id`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_parent`  (`parent_id`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_created_at` (`created_at` DESC);

-- 3) post_comment_likes 테이블
CREATE TABLE IF NOT EXISTS `post_comment_likes` (
    `id`          BINARY(16) PRIMARY KEY,
    `user_id`     BINARY(16) NOT NULL,
    `comment_id`  BINARY(16) NOT NULL,
    `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_post_comment_likes_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_post_comment_likes_post`
    FOREIGN KEY (`comment_id`)
    REFERENCES `post_comments`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_post_comment_likes_user_comment` (`user_id`, `comment_id`)
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 4) post_comment_likes 인덱스
ALTER TABLE `post_comment_likes`
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_user`     (`user_id`),
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_comment`  (`comment_id`);

-- Commit transaction
COMMIT;
