-- V1.2.0_004_add_sender_to_notifications.sql
-- Description: notifications 테이블에 sender 필드 추가 (발신자 관리)
-- Created: 2025-05-15 14:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1. notifications 테이블에 sender 관련 컬럼 추가
ALTER TABLE `notifications`
  -- sender_id 컬럼 추가 (nullable, 시스템 알림의 경우 NULL)
  ADD COLUMN `sender_id` BINARY(16) NULL COMMENT '발신자 ID (NULL이면 시스템 알림)' AFTER `user_id`,
  
  -- receiver_id 컬럼 추가 (기존 user_id와 동일한 값)
  ADD COLUMN `receiver_id` BINARY(16) NOT NULL COMMENT '수신자 ID' AFTER `sender_id`;

-- 2. 기존 데이터의 user_id 값을 receiver_id로 복사
UPDATE `notifications` 
SET `receiver_id` = `user_id`;

-- 3. 외래키 제약조건 추가
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_sender_id`
    FOREIGN KEY (`sender_id`)
    REFERENCES `users`(`id`)
    ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notifications_receiver_id`
    FOREIGN KEY (`receiver_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE;

-- 4. 성능 최적화를 위한 인덱스 추가
ALTER TABLE `notifications`
  ADD INDEX IF NOT EXISTS `idx_notifications_receiver_status` (`receiver_id`, `status`) COMMENT '수신자별 상태 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_sender_id` (`sender_id`) COMMENT '발신자별 알림 조회용',
  ADD INDEX IF NOT EXISTS `idx_notifications_sender_null` ((ISNULL(`sender_id`)), `created_at` DESC) COMMENT '시스템 알림 조회용';

-- 5. notification_records 테이블의 from_user_id 외래키 제약조건 수정
-- 기존 제약조건 확인 및 삭제
SET @constraintExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'notification_records'
      AND CONSTRAINT_NAME = 'fk_notification_records_from_user_id'
);

-- 기존 외래키가 있다면 삭제 후 재생성
SET @dropConstraintSQL = IF(@constraintExists > 0,
    'ALTER TABLE notification_records DROP FOREIGN KEY fk_notification_records_from_user_id',
    'SELECT ''constraint does not exist'' AS message'
);

PREPARE stmt FROM @dropConstraintSQL;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 새로운 외래키 제약조건 추가 (CASCADE로 변경)
ALTER TABLE `notification_records`
  ADD CONSTRAINT `fk_notification_records_from_user_id`
    FOREIGN KEY (`from_user_id`)
    REFERENCES `users`(`id`)
    ON DELETE CASCADE;

-- 6. 기존 user_id 컬럼 deprecated 처리를 위해 주석 변경
ALTER TABLE `notifications` 
  MODIFY `user_id` BINARY(16) NOT NULL COMMENT '[DEPRECATED] 기존 사용자 ID - receiver_id 사용 권장';

-- 7. 알림 타입 ENUM 업데이트 (필요시)
ALTER TABLE `notifications` 
  MODIFY `type` ENUM('RECORD_REQUEST', 'FRIEND_REQUEST', 'GAME_NOTICE', 'COMMENT_ALERT', 
                    'SYSTEM_NOTICE', 'NEW_THEME', 'GAME_RECORD_REQUEST') 
  NOT NULL COMMENT '알림 타입';

-- 8. 스키마 버전 기록
INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.2.0_004', 'Add sender_id and receiver_id to notifications table, update notification_records FK', 'SQL', 'V1.2.0_004_add_sender_to_notifications.sql', MD5('V1.2.0_004'), 'system', 0, 1);

COMMIT;