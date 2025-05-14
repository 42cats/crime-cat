-- V1.2.0_003_create_notification_indexes.sql
-- Description: 알림 시스템 성능 최적화를 위한 추가 인덱스 생성
-- Created: 2025-05-14 11:30:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1. notifications 테이블 추가 인덱스
-- 만료 알림과 읽지 않은 알림 동시 조회용
ALTER TABLE `notifications`
  ADD INDEX IF NOT EXISTS `idx_notifications_expires_status` (`expires_at`, `status`) COMMENT '만료 & 상태 기준 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_type_created` (`type`, `created_at` DESC) COMMENT '타입별 최신 알림 조회용';

-- 2. notification_records 테이블 추가 인덱스  
-- 게임 기록별 요청 이력 조회용
ALTER TABLE `notification_records`
  ADD INDEX IF NOT EXISTS `idx_records_game_history_id` (`game_history_id`) COMMENT '게임 기록별 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_status_created` (`status`, `created_at` DESC) COMMENT '상태별 최신 요청 조회용';

-- 3. JSON 필드 가상 컬럼 생성 (필요시 활용)
-- 예: 자주 조회되는 JSON 필드를 가상 컬럼으로 생성
-- ALTER TABLE notifications 
-- ADD COLUMN requester_id BINARY(16) AS (JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.requesterId'))) VIRTUAL,
-- ADD INDEX idx_notifications_virtual_requester (requester_id);

-- 4. 스키마 버전 기록
INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.2.0_003', 'Create additional indexes for notifications performance optimization', 'SQL', 'V1.2.0_003_create_notification_indexes.sql', MD5('V1.2.0_003'), 'system', 0, 1);

COMMIT;