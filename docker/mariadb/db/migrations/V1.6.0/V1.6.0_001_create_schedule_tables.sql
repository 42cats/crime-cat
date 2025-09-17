-- Migration: V1.6.0_001_create_schedule_tables.sql
-- Description: 일정 관리 기능에 필요한 테이블(events, event_participants, user_calendars)을 생성합니다.
-- Created: 2025-08-13 00:00:00

USE ${DB_DISCORD};
START TRANSACTION;

-- 1) events 테이블 생성
CREATE TABLE IF NOT EXISTS `events` (
  `id` BINARY(16) PRIMARY KEY,
  `creator_id` BINARY(16) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'RECRUITING',
  `max_participants` INT NULL COMMENT '최대 참여 인원 (null이면 무제한)',
  `scheduled_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_events_creator`
    FOREIGN KEY (`creator_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) event_participants 테이블 생성
CREATE TABLE IF NOT EXISTS `event_participants` (
  `id` BINARY(16) PRIMARY KEY,
  `event_id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_participants_event`
    FOREIGN KEY (`event_id`)
    REFERENCES `events`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_participants_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE CASCADE,
  UNIQUE KEY `uk_event_user` (`event_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) user_calendars 테이블 생성
CREATE TABLE IF NOT EXISTS `user_calendars` (
  `id` BINARY(16) PRIMARY KEY,
  `user_id` BINARY(16) NOT NULL,
  `ical_url` VARCHAR(2048) NOT NULL,
  `last_synced_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_calendars_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE CASCADE,
  UNIQUE KEY `uk_user_calendar` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) 인덱스 추가
ALTER TABLE `events`
  ADD INDEX `idx_events_creator_id` (`creator_id`),
  ADD INDEX `idx_events_category` (`category`),
  ADD INDEX `idx_events_status` (`status`);

ALTER TABLE `event_participants`
  ADD INDEX `idx_participants_event_id` (`event_id`),
  ADD INDEX `idx_participants_user_id` (`user_id`);

ALTER TABLE `user_calendars`
  ADD INDEX `idx_calendars_user_id` (`user_id`);

COMMIT;
