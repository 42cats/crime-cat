-- Migration: V1.1.0_010_add_post_post_comment_table.sql
-- Created: 2025-05-13 13:37:47

USE ${DB_DISCORD};

-- 여기에 마이그레이션 SQL을 작성하세요

-- 1) board_posts 테이블
CREATE TABLE IF NOT EXISTS `board_posts` (
    `id`             BINARY(16)     PRIMARY KEY,
    `number`         INT            NOT NULL AUTO_INCREMENT UNIQUE,
    `subject`        VARCHAR(200)   NOT NULL,
    `content`        TEXT           NOT NULL,
    `user`           BINARY(16)     NOT NULL,
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
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 2) board_posts 인덱스
ALTER TABLE `board_posts`
    ADD INDEX IF NOT EXISTS `idx_board_posts_user`        (`user`),
    ADD INDEX IF NOT EXISTS `idx_board_posts_created_at` (`created_at` DESC);

-- 3) post_likes 테이블
CREATE TABLE IF NOT EXISTS `board_post_likes` (
    `id`          BINARY(16) PRIMARY KEY,
    `user`        BINARY(16) NOT NULL,
    `post`        BINARY(16) NOT NULL,
    `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_board_post_likes_user`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`)
    ON DELETE RESTRICT,
    CONSTRAINT `fk_board_post_likes_post`
    FOREIGN KEY (`post`)
    REFERENCES `board_posts`(`id`)
    ON DELETE CASCADE,
    UNIQUE KEY `uk_board_post_likes_user_post` (`user`, `post`)
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 4) post_likes 인덱스
ALTER TABLE `board_post_likes`
    ADD INDEX IF NOT EXISTS `idx_board_post_likes_user`     (`user`),
    ADD INDEX IF NOT EXISTS `idx_board_post_likes_post`     (`post`);

-- 5) post_comments 테이블
CREATE TABLE IF NOT EXISTS `post_comments` (
    `id`             BINARY(16)     PRIMARY KEY,
    `content`        TEXT           NOT NULL,
    `user`           BINARY(16)     NOT NULL,
    `post`           BINARY(16)     NOT NULL,
    `parent`         BINARY(16)     DEFAULT NULL,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME       NULL DEFAULT NULL,
    `likes`          INT            NOT NULL DEFAULT 0,
    `is_deleted`     BOOLEAN        NOT NULL DEFAULT FALSE,
    `is_secret`      BOOLEAN        NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_post_comments_author`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`),
    CONSTRAINT `fk_post_comments_post`
    FOREIGN KEY (`post`)
    REFERENCES `board_posts`(`id`),
    CONSTRAINT `fk_post_comments_parent`
    FOREIGN KEY (`parent`)
    REFERENCES `post_comments`(`id`)
    ON DELETE RESTRICT
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 2) post_comments 인덱스
ALTER TABLE `post_comments`
    ADD INDEX IF NOT EXISTS `idx_post_comments_user`    (`user`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_post`    (`post`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_parent`  (`parent`),
    ADD INDEX IF NOT EXISTS `idx_post_comments_created_at` (`created_at` DESC);

-- 3) post_comment_likes 테이블
CREATE TABLE IF NOT EXISTS `post_comment_likes` (
    `id`          BINARY(16) PRIMARY KEY,
    `user`        BINARY(16) NOT NULL,
    `comment`     BINARY(16) NOT NULL,
    `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_post_comment_likes_user`
    FOREIGN KEY (`user`)
    REFERENCES `web_users`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_post_comment_likes_post`
    FOREIGN KEY (`comment`)
    REFERENCES `post_comments`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_post_comment_likes_user_comment` (`user`, `comment`)
    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci;

-- 4) post_likes 인덱스
ALTER TABLE `post_comment_likes`
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_user`     (`user`),
    ADD INDEX IF NOT EXISTS `idx_post_comment_likes_comment`  (`comment`);

