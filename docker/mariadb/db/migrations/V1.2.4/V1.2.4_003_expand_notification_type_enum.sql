-- V1.2.4_003_expand_notification_type_enum.sql

-- 트랜잭션 시작
START TRANSACTION;

-- notifications 테이블의 type 컬럼 ENUM 타입 확장
SET @sql_alter_notifications = '
ALTER TABLE `notifications`
MODIFY COLUMN `type` ENUM(
    ''FRIEND_REQUEST'',
    ''GAME_NOTICE'',
    ''COMMENT_ALERT'',
    ''SYSTEM_NOTICE'',
    ''NEW_THEME'',
    ''GAME_RECORD_REQUEST'',
    ''USER_POST_NEW'',
    ''USER_POST_COMMENT'',
    ''USER_POST_COMMENT_REPLY''
) NOT NULL COMMENT ''알림 타입'';
';

-- 실행 및 PREPARE
PREPARE stmt_alter_notifications FROM @sql_alter_notifications;
EXECUTE stmt_alter_notifications;
DEALLOCATE PREPARE stmt_alter_notifications;

-- 트랜잭션 커밋
COMMIT;

-- 컬럼 변경 확인
SHOW COLUMNS FROM `notifications` LIKE 'type';