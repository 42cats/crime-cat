-- Migration: V1.6.1_001_extend_events_table.sql
-- Description: events 테이블에 이벤트 타입, 최소 참여 인원, 확정 시간 컬럼을 추가합니다.
-- Created: 2025-08-19 00:00:00

USE ${DB_DISCORD};

-- events 테이블 확장
ALTER TABLE `events`
  ADD COLUMN `event_type` VARCHAR(20) NOT NULL DEFAULT 'FIXED' COMMENT '이벤트 타입: FIXED(확정일정), FLEXIBLE(협의일정)',
  ADD COLUMN `min_participants` INT NOT NULL DEFAULT 1 COMMENT '최소 참여 인원',
  ADD COLUMN `confirmed_at` DATETIME NULL COMMENT '일정 확정 시점';

-- 인덱스 추가
ALTER TABLE `events`
  ADD INDEX `idx_events_event_type` (`event_type`),
  ADD INDEX `idx_events_confirmed_at` (`confirmed_at`);

-- 기존 데이터에 대한 기본값 설정
UPDATE `events` SET `event_type` = 'FIXED' WHERE `event_type` IS NULL;
UPDATE `events` SET `min_participants` = 1 WHERE `min_participants` IS NULL;