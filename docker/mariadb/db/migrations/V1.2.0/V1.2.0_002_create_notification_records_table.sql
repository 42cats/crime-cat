-- V1.2.0_002_create_notification_records_table.sql
-- Description: 기록 요청 알림을 위한 notification_records 테이블 생성
-- Created: 2025-05-14 10:30:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1. notification_records 테이블 생성
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
  
  -- 외래키 제약조건
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
    REFERENCES `game_history`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='기록 요청 알림 상세 정보';

-- 2. 성능 최적화를 위한 인덱스 추가
ALTER TABLE `notification_records`
  ADD INDEX IF NOT EXISTS `idx_records_notification_id`   (`notification_id`) COMMENT '알림별 기록 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_to_user_id`        (`to_user_id`) COMMENT '사용자별 받은 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_from_user_id`      (`from_user_id`) COMMENT '사용자별 보낸 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_status`            (`status`) COMMENT '상태별 요청 조회용',
  ADD INDEX IF NOT EXISTS `idx_records_compound`          (`to_user_id`, `status`, `created_at` DESC) COMMENT '사용자 상태별 최신 요청 조회용';

-- 3. 중복 요청 방지를 위한 유니크 제약조건 (선택적)
-- 같은 사용자가 같은 기록에 대해 중복 요청하는 것을 방지
SET @constraintExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notification_records'
      AND CONSTRAINT_NAME = 'uk_records_unique_request'
);

SET @addConstraintSQL = IF(@constraintExists = 0,
    'ALTER TABLE notification_records 
     ADD CONSTRAINT uk_records_unique_request 
     UNIQUE (from_user_id, to_user_id, game_history_id, request_type, status)',
    'SELECT ''unique constraint already exists'' AS message'
);

-- 4. 스키마 버전 확인 및 기록
INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.2.0_002', 'Create notification_records table with indexes and constraints', 'SQL', 'V1.2.0_002_create_notification_records_table.sql', MD5('V1.2.0_002'), 'system', 0, 1);

COMMIT;