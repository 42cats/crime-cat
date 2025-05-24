-- V1.2.5_004_align_user_columns.sql
-- 데이터베이스 컬럼과 Java 엔티티 매핑 일치시키기 위한 마이그레이션

USE discord;

-- 트랜잭션 시작
START TRANSACTION;

-- escape_room_comments 테이블의 user_id 컬럼을 web_user_id로 변경
-- 현재 web_user_id 이미 존재하므로 확인 후 처리
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'discord'
    AND table_name = 'escape_room_comments'
    AND column_name = 'user_id'
);

SET @rename_column = IF(@column_exists > 0,
    'ALTER TABLE `escape_room_comments` CHANGE COLUMN `user_id` `web_user_id` BINARY(16) NOT NULL;',
    'SELECT 1');

PREPARE stmt FROM @rename_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- escape_room_history 테이블의 user_id 컬럼을 web_user_id로 변경
-- 현재 web_user_id 이미 존재하므로 확인 후 처리
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'discord'
    AND table_name = 'escape_room_historys'
    AND column_name = 'user_id'
);

SET @rename_column = IF(@column_exists > 0,
    'ALTER TABLE `escape_room_historys` CHANGE COLUMN `user_id` `web_user_id` BINARY(16) NOT NULL;',
    'SELECT 1');

PREPARE stmt FROM @rename_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 외래키 재설정
-- 인덱스 재설정

-- 트랜잭션 커밋
COMMIT;

-- 변경사항 확인
SHOW COLUMNS FROM `escape_room_comments` LIKE 'web_user_id';
SHOW COLUMNS FROM `escape_room_historys` LIKE 'web_user_id';