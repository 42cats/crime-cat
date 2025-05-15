-- V1.2.0_complete_notification_system.sql
-- Description: 알림 시스템 완전한 구현 (notifications 생성부터 sender/receiver 추가까지)
-- Created: 2025-05-15 15:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1. notifications 테이블 생성 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          BINARY(16)    NOT NULL COMMENT '알림 ID (UUID)',
  `user_id`     BINARY(16)    NOT NULL COMMENT '사용자 ID',
  `type`        ENUM('RECORD_REQUEST', 'FRIEND_REQUEST', 'GAME_NOTICE', 'COMMENT_ALERT', 'SYSTEM_NOTICE', 'NEW_THEME', 'GAME_RECORD_REQUEST') 
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

-- 2. notifications 테이블에 sender/receiver 컬럼 추가 (이미 있다면 무시)
SET @sender_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'sender_id'
);

SET @add_sender = IF(@sender_exists = 0,
    'ALTER TABLE notifications 
     ADD COLUMN sender_id BINARY(16) NULL COMMENT ''발신자 ID (NULL이면 시스템 알림)'' AFTER user_id',
    'SELECT ''sender_id already exists'' AS info'
);
PREPARE stmt FROM @add_sender; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @receiver_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications' 
      AND COLUMN_NAME = 'receiver_id'
);

SET @add_receiver = IF(@receiver_exists = 0,
    'ALTER TABLE notifications 
     ADD COLUMN receiver_id BINARY(16) NOT NULL COMMENT ''수신자 ID'' AFTER sender_id',
    'SELECT ''receiver_id already exists'' AS info'
);
PREPARE stmt FROM @add_receiver; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. 기존 데이터의 user_id를 receiver_id로 복사 (새 컬럼만 추가된 경우)
SET @copy_data = IF(@receiver_exists = 0,
    'UPDATE notifications SET receiver_id = user_id',
    'SELECT ''data already copied'' AS info'
);
PREPARE stmt FROM @copy_data; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. notifications 테이블에 외래키 제약조건 추가
SET @sender_fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications'
      AND CONSTRAINT_NAME = 'fk_notifications_sender_id'
);

SET @add_sender_fk = IF(@sender_fk_exists = 0,
    'ALTER TABLE notifications
     ADD CONSTRAINT fk_notifications_sender_id
     FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT ''sender FK already exists'' AS info'
);
PREPARE stmt FROM @add_sender_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @receiver_fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notifications'
      AND CONSTRAINT_NAME = 'fk_notifications_receiver_id'
);

SET @add_receiver_fk = IF(@receiver_fk_exists = 0,
    'ALTER TABLE notifications
     ADD CONSTRAINT fk_notifications_receiver_id
     FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT ''receiver FK already exists'' AS info'
);
PREPARE stmt FROM @add_receiver_fk; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5. notification_records 테이블 생성 (game_histories 참조 - 복수형 주의!)
CREATE TABLE IF NOT EXISTS `notification_records` (
  `id`                BINARY(16)    NOT NULL COMMENT '기록 요청 ID (UUID)',
  `notification_id`   BINARY(16)    NOT NULL COMMENT '연결된 알림 ID',
  `from_user_id`      BINARY(16)    NULL COMMENT '요청한 사용자 ID (NULL 가능)',
  `to_user_id`        BINARY(16)    NOT NULL COMMENT '요청받은 사용자 ID',
  `game_history_id`   BINARY(16)    NULL COMMENT '관련 게임 기록 ID',
  `request_type`      ENUM('RECORD_SHARE', 'RECORD_TRANSFER') 
                                    NOT NULL COMMENT '요청 타입',
  `status`            ENUM('PENDING', 'ACCEPTED', 'DECLINED') 
                                    NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  `message`           TEXT          NULL COMMENT '추가 메시지',
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at`        TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  
  PRIMARY KEY (`id`),
  
  -- 외래키 제약조건 (game_histories 참조 - 복수형!)
  CONSTRAINT `fk_notification_records_notification_id`
    FOREIGN KEY (`notification_id`)
    REFERENCES `notifications`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notification_records_from_user_id`
    FOREIGN KEY (`from_user_id`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_notification_records_to_user_id`
    FOREIGN KEY (`to_user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_notification_records_game_history_id`
    FOREIGN KEY (`game_history_id`)
    REFERENCES `game_histories`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='기록 요청 알림 상세 정보';

-- 6. notifications 테이블 인덱스 추가
ALTER TABLE `notifications`
  ADD INDEX IF NOT EXISTS `idx_notifications_user_status`     (`user_id`, `status`) COMMENT '기존 호환성용',
  ADD INDEX IF NOT EXISTS `idx_notifications_receiver_status` (`receiver_id`, `status`) COMMENT '수신자별 상태 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_sender_id`       (`sender_id`) COMMENT '발신자별 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_created_at`      (`created_at` DESC) COMMENT '최신 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_expires_at`      (`expires_at`) COMMENT '만료 알림 정리용',
  ADD INDEX IF NOT EXISTS `idx_notifications_type_created`    (`type`, `created_at` DESC) COMMENT '타입별 최신 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_sender_null`     ((ISNULL(`sender_id`)), `created_at` DESC) COMMENT '시스템 알림 조회용';

-- 7. notification_records 테이블 인덱스 추가
ALTER TABLE `notification_records`
  ADD INDEX IF NOT EXISTS `idx_records_notification_id`   (`notification_id`) COMMENT '알림별 기록 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_to_user_id`        (`to_user_id`) COMMENT '사용자별 받은 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_from_user_id`      (`from_user_id`) COMMENT '사용자별 보낸 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_status`            (`status`) COMMENT '상태별 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_compound`          (`to_user_id`, `status`, `created_at` DESC) COMMENT '사용자 상태별 최신 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_game_history_id`   (`game_history_id`) COMMENT '게임 기록별 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_status_created`    (`status`, `created_at` DESC) COMMENT '상태별 최신 요청 조회용';

-- 8. 중복 요청 방지를 위한 유니크 제약조건 추가
SET @unique_constraint_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notification_records'
      AND CONSTRAINT_NAME = 'uk_records_unique_request'
);

SET @add_unique_constraint = IF(@unique_constraint_exists = 0,
    'ALTER TABLE notification_records 
     ADD CONSTRAINT uk_records_unique_request 
     UNIQUE (from_user_id, to_user_id, game_history_id, request_type)',
    'SELECT ''unique constraint already exists'' AS info'
);
PREPARE stmt FROM @add_unique_constraint; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9. user_id 컬럼 deprecated 처리
ALTER TABLE `notifications` 
  MODIFY `user_id` BINARY(16) NOT NULL COMMENT '[DEPRECATED] 기존 사용자 ID - receiver_id 사용 권장';

-- 10. 만료된 알림 자동 정리를 위한 이벤트 생성 (선택적)
SET @eventExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.EVENTS 
    WHERE EVENT_SCHEMA = DATABASE() 
      AND EVENT_NAME = 'cleanup_expired_notifications'
);

SET @createEventSQL = IF(@eventExists = 0,
    'CREATE EVENT IF NOT EXISTS cleanup_expired_notifications
     ON SCHEDULE EVERY 1 HOUR
     DO
     DELETE FROM notifications 
     WHERE expires_at IS NOT NULL 
       AND expires_at < NOW()
       AND status IN (''READ'', ''PROCESSED'')',
    'SELECT ''cleanup event already exists'' AS info'
);
PREPARE stmt FROM @createEventSQL; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 11. 스키마 버전 기록
-- 기존 실패한 버전들 정리
DELETE FROM schema_version WHERE version LIKE '1.2.0_00%';

INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.2.0_complete', 'Complete notification system with sender/receiver and notification_records', 'SQL', 'V1.2.0_complete_notification_system.sql', MD5('V1.2.0_complete'), 'system', 0, 1);

COMMIT;