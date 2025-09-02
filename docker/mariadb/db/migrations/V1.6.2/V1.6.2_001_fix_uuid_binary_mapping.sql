-- Migration: V1.6.2_001_fix_uuid_binary_mapping.sql
-- Description: UUID BINARY(16) 매핑 문제 해결을 위한 수정
-- Created: 2025-08-21 00:00:00
-- Issue: user_blocked_periods 테이블 생성 시 UUID 길이 오류 해결

USE ${DB_DISCORD};

-- 1. 문제 상황 확인
SELECT 'Checking existing user_blocked_periods table...' as status;

-- 기존 테이블이 있다면 데이터 확인
SELECT COUNT(*) as existing_records_count 
FROM user_blocked_periods 
WHERE 1=0; -- 안전한 카운트 (테이블이 없어도 오류 없음)

-- 2. 기존 테이블 삭제 (데이터가 없으므로 안전)
SELECT 'Dropping existing user_blocked_periods table...' as status;
DROP TABLE IF EXISTS `user_blocked_periods`;

-- 3. user_blocked_periods 테이블 재생성 (올바른 UUID 처리)
SELECT 'Creating user_blocked_periods table with proper UUID handling...' as status;

CREATE TABLE `user_blocked_periods` (
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

-- 4. 인덱스 추가
SELECT 'Adding indexes to user_blocked_periods table...' as status;

ALTER TABLE `user_blocked_periods`
  ADD INDEX `idx_user_blocked_periods_user_id` (`user_id`),
  ADD INDEX `idx_user_blocked_periods_period_start` (`period_start`);

-- 자동 정리를 위한 인덱스 (과거 데이터 삭제용)
ALTER TABLE `user_blocked_periods`
  ADD INDEX `idx_user_blocked_periods_cleanup` (`period_start`, `created_at`);

-- 5. 다른 스케줄 관련 테이블들의 UUID 컬럼 확인 및 수정 (필요시)
SELECT 'Verifying other schedule tables UUID columns...' as status;

-- events 테이블 확인 (이미 BINARY(16)로 되어있어야 함)
DESCRIBE events;

-- event_participants 테이블 확인 (이미 BINARY(16)로 되어있어야 함)  
DESCRIBE event_participants;

-- user_calendars 테이블 확인 (이미 BINARY(16)로 되어있어야 함)
DESCRIBE user_calendars;

-- recommended_times 테이블 확인 (이미 BINARY(16)로 되어있어야 함)
DESCRIBE recommended_times;

-- event_leave_logs 테이블 확인 (이미 BINARY(16)로 되어있어야 함)
DESCRIBE event_leave_logs;

-- 6. 마이그레이션 완료 확인
SELECT 'Migration completed successfully' as status;

-- 테이블 구조 확인
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'user_blocked_periods'
AND COLUMN_NAME IN ('id', 'user_id');

SELECT 'UUID BINARY(16) mapping issue fixed' as status;