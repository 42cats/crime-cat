-- Migration: V1.6.1_003_create_user_blocked_periods_table.sql
-- Description: 사용자의 비활성화 날짜를 비트맵으로 압축 저장하는 테이블을 생성합니다.
-- Created: 2025-08-19 00:00:00

USE ${DB_DISCORD};

-- user_blocked_periods 테이블 생성
CREATE TABLE IF NOT EXISTS `user_blocked_periods` (
  `id` BINARY(16) PRIMARY KEY,
  `user_id` BINARY(16) NOT NULL,
  `period_start` DATE NOT NULL COMMENT '3개월 기간의 시작일 (매월 1일)',
  `blocked_days_bitmap` BINARY(12) NOT NULL COMMENT '90일을 비트맵으로 압축 저장 (90bit = 12byte)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_blocked_periods_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE CASCADE,
  UNIQUE KEY `uk_user_blocked_period` (`user_id`, `period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 인덱스 추가
ALTER TABLE `user_blocked_periods`
  ADD INDEX `idx_user_blocked_periods_user_id` (`user_id`),
  ADD INDEX `idx_user_blocked_periods_period_start` (`period_start`);

-- 자동 정리를 위한 인덱스 (과거 데이터 삭제용)
ALTER TABLE `user_blocked_periods`
  ADD INDEX `idx_user_blocked_periods_cleanup` (`period_start`, `created_at`);