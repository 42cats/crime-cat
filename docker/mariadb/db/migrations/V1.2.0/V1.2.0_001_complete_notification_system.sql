-- V1.2.0_002_only_notifications.sql
-- Description: 알림 시스템 – notifications 테이블만 구현
-- Created: 2025-05-15 18:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 1) notifications 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          BINARY(16)    NOT NULL COMMENT '알림 ID (UUID)',
  `user_id`     BINARY(16)    NOT NULL COMMENT '기존 사용자 ID (DEPRECATED)',
  `type`        ENUM(
                   'FRIEND_REQUEST',
                   'GAME_NOTICE',
                   'COMMENT_ALERT',
                   'SYSTEM_NOTICE',
                   'NEW_THEME',
                   'GAME_RECORD_REQUEST'
                 ) NOT NULL COMMENT '알림 타입',
  `title`       VARCHAR(255)  NOT NULL COMMENT '알림 제목',
  `message`     TEXT          NOT NULL COMMENT '알림 메시지',
  `data_json`   JSON          NULL COMMENT '알림별 특화 데이터',
  `status`      ENUM('UNREAD','READ','PROCESSED')
                   NOT NULL DEFAULT 'UNREAD' COMMENT '알림 상태',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at`  TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `expires_at`  TIMESTAMP     NULL COMMENT '만료 시간',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='사용자 알림 정보';

-- 2) sender_id 컬럼 추가
SET @exist = (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name   = 'notifications'
     AND column_name  = 'sender_id'
);
SET @sql = IF(
  @exist = 0,
  'ALTER TABLE `notifications`
     ADD COLUMN `sender_id` BINARY(16) NULL
       COMMENT ''발신자 ID (NULL이면 시스템 알림)'' AFTER `user_id`;',
  'SELECT ''sender_id already exists'';'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) receiver_id 컬럼 추가 및 기존 데이터 마이그레이션
SET @exist = (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name   = 'notifications'
     AND column_name  = 'receiver_id'
);
IF @exist = 0 THEN
  SET @sql = 'ALTER TABLE `notifications`
                ADD COLUMN `receiver_id` BINARY(16) NOT NULL
                  COMMENT ''수신자 ID'' AFTER `sender_id`;';
  PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

  PREPARE stmt FROM 'UPDATE `notifications` SET `receiver_id` = `user_id`;';
  EXECUTE stmt; DEALLOCATE PREPARE stmt;
ELSE
  PREPARE stmt FROM 'SELECT ''receiver_id already exists'';'; EXECUTE stmt; DEALLOCATE PREPARE stmt;
END IF;

-- 4) sender_id FK
SET @exist = (
  SELECT COUNT(*) FROM information_schema.key_column_usage
   WHERE constraint_schema = DATABASE()
     AND table_name        = 'notifications'
     AND constraint_name   = 'fk_notifications_sender_id'
);
SET @sql = IF(
  @exist = 0,
  'ALTER TABLE `notifications`
     ADD CONSTRAINT `fk_notifications_sender_id`
       FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;',
  'SELECT ''sender FK already exists'';'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) receiver_id FK
SET @exist = (
  SELECT COUNT(*) FROM information_schema.key_column_usage
   WHERE constraint_schema = DATABASE()
     AND table_name        = 'notifications'
     AND constraint_name   = 'fk_notifications_receiver_id'
);
SET @sql = IF(
  @exist = 0,
  'ALTER TABLE `notifications`
     ADD CONSTRAINT `fk_notifications_receiver_id`
       FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;',
  'SELECT ''receiver FK already exists'';'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) 인덱스 추가
ALTER TABLE `notifications`
  ADD INDEX IF NOT EXISTS `idx_notifications_user_status`  (`user_id`,`status`),
  ADD INDEX IF NOT EXISTS `idx_notifications_receiver`     (`receiver_id`,`status`),
  ADD INDEX IF NOT EXISTS `idx_notifications_sender`       (`sender_id`),
  ADD INDEX IF NOT EXISTS `idx_notifications_created_at`   (`created_at` DESC);

-- 7) user_id 컬럼 DEPRECATED 주석 갱신
ALTER TABLE `notifications`
  MODIFY `user_id` BINARY(16) NOT NULL
    COMMENT '[DEPRECATED] 기존 사용자 ID - receiver_id 사용 권장';

-- 8) 스키마 버전 기록
DELETE FROM `schema_version` WHERE version LIKE '1.2.0_00%';
INSERT INTO `schema_version`
  (`version`,`description`,`type`,`script`,`checksum`,`installed_by`,`execution_time`,`success`)
VALUES
  ('1.2.0_notifications','알림 시스템 – notifications 테이블만 구현','SQL',
   'V1.2.0_complete_notification_system.sql', MD5('V1.2.0_notifications'),
   'system',0,1);

COMMIT;
