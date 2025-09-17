-- Migration: V1.8.0_001_extend_multiple_calendars_system.sql
-- Description: 다중 iCalendar 지원 및 순서 기반 색상 할당 시스템 구현
-- Created: 2025-08-25 00:00:00

USE ${DB_DISCORD};
START TRANSACTION;

-- 1) user_calendars 테이블 기존 UNIQUE 제약조건 제거 및 확장
ALTER TABLE `user_calendars`
  DROP INDEX `uk_user_calendar`;

ALTER TABLE `user_calendars` 
  ADD COLUMN `calendar_name` VARCHAR(255) NULL COMMENT 'iCal에서 추출한 캘린더 이름 (X-WR-CALNAME)',
  ADD COLUMN `display_name` VARCHAR(100) NULL COMMENT '사용자 설정 표시 이름',
  ADD COLUMN `color_index` TINYINT DEFAULT 0 COMMENT '색상 인덱스 (0-7, 코드에서 매핑)',
  ADD COLUMN `sync_status` VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING|SUCCESS|ERROR',
  ADD COLUMN `sync_error_message` TEXT NULL COMMENT '동기화 실패 시 오류 메시지',
  ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
  ADD COLUMN `sort_order` INT DEFAULT 0 COMMENT '정렬 순서';

-- 2) 새로운 복합 UNIQUE 제약조건 (같은 사용자가 같은 URL 중복 등록 방지)
ALTER TABLE `user_calendars`
  ADD UNIQUE KEY `uk_user_calendar_url` (`user_id`, `ical_url`);

-- 3) events 테이블에 캘린더 연결 정보 추가
ALTER TABLE `events`
  ADD COLUMN `calendar_id` BINARY(16) NULL COMMENT '연결된 캘린더 ID (iCal 이벤트의 경우)',
  ADD CONSTRAINT `fk_events_calendar`
    FOREIGN KEY (`calendar_id`)
    REFERENCES `user_calendars`(`id`)
    ON DELETE SET NULL;

-- 4) 기존 데이터 업데이트 (기존 캘린더들을 첫 번째 색상으로 설정)
UPDATE `user_calendars` 
SET 
  `color_index` = 0,
  `display_name` = COALESCE(`calendar_name`, '개인 캘린더'),
  `sort_order` = 0,
  `sync_status` = CASE 
    WHEN `last_synced_at` IS NOT NULL THEN 'SUCCESS'
    ELSE 'PENDING'
  END
WHERE `color_index` IS NULL;

-- 5) 인덱스 추가
ALTER TABLE `user_calendars`
  ADD INDEX `idx_calendars_user_active` (`user_id`, `is_active`),
  ADD INDEX `idx_calendars_sync_status` (`sync_status`),
  ADD INDEX `idx_calendars_sort_order` (`sort_order`),
  ADD INDEX `idx_calendars_color_index` (`color_index`);

ALTER TABLE `events`
  ADD INDEX `idx_events_calendar_id` (`calendar_id`);

-- 6) 제약조건 추가
ALTER TABLE `user_calendars`
  ADD CONSTRAINT `chk_color_index_range`
    CHECK (`color_index` >= 0 AND `color_index` <= 7),
  ADD CONSTRAINT `chk_display_name_length`
    CHECK (`display_name` IS NULL OR CHAR_LENGTH(`display_name`) <= 100),
  ADD CONSTRAINT `chk_sync_status_values`
    CHECK (`sync_status` IN ('PENDING', 'SUCCESS', 'ERROR'));

COMMIT;