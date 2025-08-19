-- Migration: V1.6.1_004_add_leave_event_functionality.sql  
-- Description: 나가기 기능을 위한 event_participants 테이블 확장 및 인덱스 최적화
-- Created: 2025-08-19 00:00:00

USE ${DB_DISCORD};

-- event_participants 테이블에 나간 시점 기록 컬럼 추가
ALTER TABLE `event_participants`
  ADD COLUMN `left_at` DATETIME NULL COMMENT '일정에서 나간 시점 (NULL이면 참여중)';

-- 성능 최적화를 위한 인덱스 추가
ALTER TABLE `event_participants`
  ADD INDEX `idx_event_participants_left_at` (`left_at`),
  ADD INDEX `idx_event_participants_active` (`event_id`, `left_at`); -- left_at이 NULL인 활성 참여자 조회용

-- 기존 참여자들은 모두 참여중 상태로 설정 (left_at = NULL 유지)
-- UPDATE는 필요없음 - 새로 추가된 컬럼은 기본적으로 NULL