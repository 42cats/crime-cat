-- Migration: V1.3.0_001_create_theme_advertisements.sql
-- Created: 2025-05-25 
-- Create theme advertisements table for managing theme ads with date ranges

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- 1) Create theme_advertisements table
CREATE TABLE IF NOT EXISTS `theme_advertisements` (
    `id`             BINARY(16)     PRIMARY KEY,
    `theme_id`       BINARY(16)     NOT NULL,
    `theme_type`     ENUM('CRIMESCENE', 'ESCAPE_ROOM', 'MURDER_MYSTERY', 'REALWORLD') NOT NULL,
    `display_order`  INT            NOT NULL DEFAULT 0,
    `start_date`     DATETIME       NOT NULL,
    `end_date`       DATETIME       NOT NULL,
    `is_active`      BOOLEAN        NOT NULL DEFAULT TRUE,
    `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_by`     BINARY(16)     NOT NULL,
    `updated_at`     DATETIME       NULL DEFAULT NULL,
    `updated_by`     BINARY(16)     NULL DEFAULT NULL,
    
    CONSTRAINT `fk_theme_advertisements_theme`
        FOREIGN KEY (`theme_id`)
        REFERENCES `game_themes`(`id`)
        ON DELETE CASCADE,
        
    CONSTRAINT `fk_theme_advertisements_created_by`
        FOREIGN KEY (`created_by`)
        REFERENCES `web_users`(`id`)
        ON DELETE RESTRICT,
        
    CONSTRAINT `fk_theme_advertisements_updated_by`
        FOREIGN KEY (`updated_by`)
        REFERENCES `web_users`(`id`)
        ON DELETE RESTRICT
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- 2) Create indexes for theme_advertisements
ALTER TABLE `theme_advertisements`
    ADD INDEX IF NOT EXISTS `idx_theme_ads_theme` (`theme_id`),
    ADD INDEX IF NOT EXISTS `idx_theme_ads_active_dates` (`is_active`, `start_date`, `end_date`),
    ADD INDEX IF NOT EXISTS `idx_theme_ads_display_order` (`display_order`),
    ADD INDEX IF NOT EXISTS `idx_theme_ads_created_at` (`created_at` DESC);

-- 3) Add unique constraint to prevent duplicate active ads for same theme in overlapping periods
-- Note: This is a business logic constraint that will be handled in application layer
-- as MySQL doesn't support complex check constraints with date ranges

-- Commit transaction
COMMIT;
