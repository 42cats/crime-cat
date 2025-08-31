-- Migration: V1.7.0_001_add_secret_schedule.sql
-- Description: 비밀 일정 기능을 위한 테이블 수정 및 보안 로그 테이블 생성
-- Created: 2025-08-21 00:00:00

USE ${DB_DISCORD};

-- 1) events 테이블에 비밀 일정 관련 컬럼 추가
ALTER TABLE `events`
  ADD COLUMN `is_secret` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '비밀 일정 여부',
  ADD COLUMN `secret_password` VARCHAR(255) NULL COMMENT 'BCrypt 해시된 비밀번호 (is_secret=true일 때만 사용)',
  ADD COLUMN `password_hint` VARCHAR(500) NULL COMMENT '비밀번호 힌트 (선택사항)';

-- 2) event_password_attempts 테이블 생성 (보안 로그)
CREATE TABLE IF NOT EXISTS `event_password_attempts` (
  `id` BINARY(16) PRIMARY KEY,
  `event_id` BINARY(16) NOT NULL,
  `user_id` BINARY(16) NULL COMMENT '로그인된 사용자의 ID (익명 접근 시 NULL)',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IPv4/IPv6 주소',
  `user_agent` VARCHAR(1000) NULL COMMENT '브라우저 정보',
  `attempt_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_success` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '비밀번호 입력 성공 여부',
  `session_id` VARCHAR(255) NULL COMMENT '세션 ID (성공 시 추적용)',
  CONSTRAINT `fk_password_attempts_event`
    FOREIGN KEY (`event_id`)
    REFERENCES `events`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_password_attempts_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `web_users`(`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) 인덱스 추가
ALTER TABLE `events`
  ADD INDEX `idx_events_is_secret` (`is_secret`);

ALTER TABLE `event_password_attempts`
  ADD INDEX `idx_attempts_event_id` (`event_id`),
  ADD INDEX `idx_attempts_user_id` (`user_id`),
  ADD INDEX `idx_attempts_ip_time` (`ip_address`, `attempt_time`),
  ADD INDEX `idx_attempts_success` (`is_success`),
  ADD INDEX `idx_attempts_time` (`attempt_time`);

-- 4) 보안 제약 조건 추가
-- 비밀 일정인 경우 반드시 패스워드가 있어야 함
ALTER TABLE `events`
  ADD CONSTRAINT `chk_secret_password`
    CHECK (
      (is_secret = FALSE AND secret_password IS NULL) 
      OR 
      (is_secret = TRUE AND secret_password IS NOT NULL AND CHAR_LENGTH(secret_password) >= 60)
    );

-- 패스워드 힌트 길이 제한
ALTER TABLE `events`
  ADD CONSTRAINT `chk_password_hint_length`
    CHECK (password_hint IS NULL OR CHAR_LENGTH(password_hint) <= 500);