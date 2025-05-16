-- V1.2.0_00_notifications_without_user_id.sql
-- Description: 알림 시스템 – user_id 컬럼 제거 버전
-- Created: 2025-05-16 16:30:00

USE ${DB_DISCORD};
START TRANSACTION;

-- 1) fk_notifications_user_id 외래키가 있으면 제거
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP FOREIGN KEY `fk_notifications_user_id`;',
    'SELECT "no fk_notifications_user_id";'
  )
  FROM information_schema.key_column_usage
  WHERE constraint_schema = DATABASE()
    AND table_name        = 'notifications'
    AND constraint_name   = 'fk_notifications_user_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) user_id 컬럼이 있으면 제거
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP COLUMN `user_id`;',
    'SELECT "no user_id column";'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name   = 'notifications'
    AND column_name  = 'user_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) 기존 인덱스가 있으면 순차적으로 제거
-- idx_notifications_user_status
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP INDEX `idx_notifications_user_status`;',
    'SELECT "no idx_notifications_user_status";'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'notifications'
    AND index_name   = 'idx_notifications_user_status'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- idx_notifications_receiver
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP INDEX `idx_notifications_receiver`;',
    'SELECT "no idx_notifications_receiver";'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'notifications'
    AND index_name   = 'idx_notifications_receiver'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- idx_notifications_sender
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP INDEX `idx_notifications_sender`;',
    'SELECT "no idx_notifications_sender";'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'notifications'
    AND index_name   = 'idx_notifications_sender'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- idx_notifications_created_at
SET @sql = (
  SELECT IF(COUNT(*)>0,
    'ALTER TABLE `notifications` DROP INDEX `idx_notifications_created_at`;',
    'SELECT "no idx_notifications_created_at";'
  )
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'notifications'
    AND index_name   = 'idx_notifications_created_at'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) 테이블이 없으면 새로 생성
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          BINARY(16)    NOT NULL COMMENT '알림 ID (UUID)',
  `sender_id`   BINARY(16)    NULL COMMENT '발신자 ID (NULL이면 시스템 알림)',
  `receiver_id` BINARY(16)    NOT NULL COMMENT '수신자 ID',
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
  `status`      ENUM('UNREAD','READ','PROCESSED') NOT NULL DEFAULT 'UNREAD' COMMENT '알림 상태',
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at`  TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `expires_at`  TIMESTAMP     NULL COMMENT '만료 시간',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_sender_id`
    FOREIGN KEY (`sender_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_receiver_id`
    FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='사용자 알림 정보 (user_id 제거)';

-- 5) 인덱스 재생성
ALTER TABLE `notifications`
  ADD INDEX `idx_notifications_receiver`    (`receiver_id`,`status`),
  ADD INDEX `idx_notifications_sender`      (`sender_id`),
  ADD INDEX `idx_notifications_created_at`  (`created_at`);


COMMIT;
