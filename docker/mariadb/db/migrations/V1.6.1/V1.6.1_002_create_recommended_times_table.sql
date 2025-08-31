-- Migration: V1.6.1_002_create_recommended_times_table.sql
-- Description: 추천 시간을 저장하는 테이블을 생성합니다.
-- Created: 2025-08-19 00:00:00

USE ${DB_DISCORD};

-- recommended_times 테이블 생성
CREATE TABLE IF NOT EXISTS `recommended_times` (
  `id` BINARY(16) PRIMARY KEY,
  `event_id` BINARY(16) NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `participant_count` INT NOT NULL COMMENT '해당 시간에 참여 가능한 인원',
  `total_participants` INT NOT NULL COMMENT '전체 참여자 수',
  `is_selected` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '생성자가 선택한 시간인지 여부',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_recommended_times_event`
    FOREIGN KEY (`event_id`)
    REFERENCES `events`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 인덱스 추가
ALTER TABLE `recommended_times`
  ADD INDEX `idx_recommended_times_event_id` (`event_id`),
  ADD INDEX `idx_recommended_times_start_time` (`start_time`),
  ADD INDEX `idx_recommended_times_selected` (`is_selected`);

-- 복합 인덱스 추가 (성능 최적화)
ALTER TABLE `recommended_times`
  ADD INDEX `idx_recommended_times_event_start` (`event_id`, `start_time`),
  ADD INDEX `idx_recommended_times_event_selected` (`event_id`, `is_selected`);