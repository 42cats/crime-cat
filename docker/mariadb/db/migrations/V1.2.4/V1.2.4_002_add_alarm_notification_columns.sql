-- V1.2.4_002_add_alarm_notification_columns.sql

-- 트랜잭션 시작
START TRANSACTION;

-- WebUser 테이블에 알림 관련 컬럼 추가
SET @sql_alter_web_users = '
ALTER TABLE `web_users`
ADD COLUMN `post_alarm` BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''게시물 알림 설정'' AFTER `email_alarm`,
ADD COLUMN `post_comment` BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''게시물 댓글 알림 설정'' AFTER `post_alarm`,
ADD COLUMN `comment_comment` BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''댓글의 댓글 알림 설정'' AFTER `post_comment`;
';

-- 실행 및 PREPARE
PREPARE stmt_alter_web_users FROM @sql_alter_web_users;
EXECUTE stmt_alter_web_users;
DEALLOCATE PREPARE stmt_alter_web_users;

-- 트랜잭션 커밋
COMMIT;

-- 컬럼 존재 확인
SHOW COLUMNS FROM `web_users` LIKE 'post_alarm';
SHOW COLUMNS FROM `web_users` LIKE 'post_comment';
SHOW COLUMNS FROM `web_users` LIKE 'comment_comment';