-- V1.2.0_001_create_notifications_table.sql
-- Description: 알림 시스템을 위한 notifications 테이블 생성
-- Created: 2025-05-14 10:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          BINARY(16)    NOT NULL COMMENT '알림 ID (UUID)',
  `user_id`     BINARY(16)    NOT NULL COMMENT '사용자 ID',
  `type`        ENUM('RECORD_REQUEST', 'FRIEND_REQUEST', 'GAME_NOTICE', 'COMMENT_ALERT', 'SYSTEM_NOTICE', 'NEW_THEME') 
                              NOT NULL COMMENT '알림 타입',
  `title`       VARCHAR(255)  NOT NULL COMMENT '알림 제목',
  `message`     TEXT          NOT NULL COMMENT '알림 메시지',
  `data_json`   JSON          NULL COMMENT '알림별 특화 데이터 (JSON)',
  `status`      ENUM('UNREAD', 'READ', 'PROCESSED') 
                              NOT NULL DEFAULT 'UNREAD' COMMENT '알림 상태',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at`  TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `expires_at`  TIMESTAMP     NULL COMMENT '만료 시간',
  
  PRIMARY KEY (`id`),
  
  -- 외래키 제약조건
  CONSTRAINT `fk_notifications_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='사용자 알림 정보';

-- 2. 성능 최적화를 위한 인덱스 추가
ALTER TABLE `notifications`
  ADD INDEX IF NOT EXISTS `idx_notifications_user_status`     (`user_id`, `status`) COMMENT '읽지 않은 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_user_type`       (`user_id`, `type`) COMMENT '타입별 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_created_at`      (`created_at` DESC) COMMENT '최신 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_expires_at`      (`expires_at`) COMMENT '만료 알림 정리용',
  ADD INDEX IF NOT EXISTS `idx_notifications_compound`        (`user_id`, `status`, `created_at` DESC) COMMENT '복합 인덱스';

-- 3. 만료된 알림 자동 정리를 위한 이벤트 생성 (선택적)
-- 이벤트가 존재하는지 확인
SET @eventExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.EVENTS 
    WHERE EVENT_SCHEMA = DATABASE() 
      AND EVENT_NAME = 'cleanup_expired_notifications'
);

-- 이벤트가 존재하지 않을 경우에만 생성
SET @createEventSQL = IF(@eventExists = 0,
    'CREATE EVENT IF NOT EXISTS cleanup_expired_notifications
     ON SCHEDULE EVERY 1 HOUR
     DO
     DELETE FROM notifications 
     WHERE expires_at IS NOT NULL 
       AND expires_at < NOW()
       AND status IN (''READ'', ''PROCESSED'')',
    'SELECT ''cleanup event already exists in schema'' AS message'
);

PREPARE stmt FROM @createEventSQL;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 스키마 버전 확인 및 기록
INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.2.0_001', 'Create notifications table with indexes and cleanup event', 'SQL', 'V1.2.0_001_create_notifications_table.sql', MD5('V1.2.0_001'), 'system', 0, 1);

COMMIT;