-- V1.5.0_001_create_board_post_attachments.sql
-- Created: 2025-01-XX
-- Add role-based audio attachment system for board posts

USE discord;

START TRANSACTION;

-- 1) board_post_attachments 테이블 생성
CREATE TABLE IF NOT EXISTS `board_post_attachments` (
    `id`                 BINARY(16)     PRIMARY KEY,
    `board_post_id`      BINARY(16)     NOT NULL,
    `attachment_type`    ENUM('AUDIO', 'IMAGE', 'DOCUMENT') NOT NULL,
    `original_filename`  VARCHAR(255)   NOT NULL,
    `stored_filename`    VARCHAR(255)   NOT NULL,
    `content_type`       VARCHAR(100)   NOT NULL,
    `file_size`          BIGINT         NOT NULL,
    `sort_order`         INT            NOT NULL DEFAULT 0,
    
    -- 오디오 전용 메타데이터
    `audio_title`        VARCHAR(255)   NULL,
    `duration_seconds`   BIGINT         NULL,
    `encryption_key`     VARCHAR(255)   NULL,
    
    -- 🔑 접근 제어 (핵심 추가)
    `access_policy`      ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PUBLIC',
    `created_by_role`    ENUM('USER', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'USER',
    
    `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME       NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_board_post_attachments_post`
    FOREIGN KEY (`board_post_id`) 
    REFERENCES `board_posts`(`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

-- 2) 인덱스 (접근 정책 기반 조회 최적화)
ALTER TABLE `board_post_attachments`
    ADD INDEX IF NOT EXISTS `idx_attachments_post_id`       (`board_post_id`),
    ADD INDEX IF NOT EXISTS `idx_attachments_type`          (`attachment_type`),
    ADD INDEX IF NOT EXISTS `idx_attachments_access_policy` (`access_policy`),
    ADD INDEX IF NOT EXISTS `idx_attachments_created_role`  (`created_by_role`),
    ADD INDEX IF NOT EXISTS `idx_attachments_sort_order`    (`sort_order`);

-- 3) temp_attachments 테이블 (역할 정보 포함)
CREATE TABLE IF NOT EXISTS `temp_attachments` (
    `id`                 BINARY(16)     PRIMARY KEY,
    `temp_id`            VARCHAR(100)   UNIQUE NOT NULL,
    `original_filename`  VARCHAR(255)   NOT NULL,
    `stored_filename`    VARCHAR(255)   NOT NULL,
    `content_type`       VARCHAR(100)   NOT NULL,
    `file_size`          BIGINT         NOT NULL,
    `user_id`            BINARY(16)     NOT NULL, -- 업로드한 사용자
    `user_role`          ENUM('USER', 'MANAGER', 'ADMIN') NOT NULL,
    
    -- 오디오 메타데이터
    `audio_title`        VARCHAR(255)   NULL,
    `duration_seconds`   BIGINT         NULL,
    `access_policy`      ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PUBLIC',
    
    `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`         DATETIME       NOT NULL,
    
    CONSTRAINT `fk_temp_attachments_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE CASCADE,
    
    INDEX `idx_temp_attachments_temp_id`    (`temp_id`),
    INDEX `idx_temp_attachments_user_id`    (`user_id`),
    INDEX `idx_temp_attachments_expires_at` (`expires_at`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci;

COMMIT;