-- V1.2.5_001_add_block_fields_and_creator_role.sql

-- 트랜잭션 시작
START TRANSACTION;

-- web_users 테이블에 차단 관련 필드 추가
SET @sql_add_block_fields = '
ALTER TABLE `web_users`
ADD COLUMN `block_reason` TEXT NULL COMMENT ''차단 사유'',
ADD COLUMN `blocked_at` DATETIME NULL COMMENT ''차단 시작 시간'',
ADD COLUMN `block_expires_at` DATETIME NULL COMMENT ''차단 만료 시간 (NULL이면 영구 차단)'';
';

-- 실행 및 PREPARE
PREPARE stmt_add_block_fields FROM @sql_add_block_fields;
EXECUTE stmt_add_block_fields;
DEALLOCATE PREPARE stmt_add_block_fields;

-- web_users 테이블의 role 컬럼 ENUM 타입에 CREATOR 추가
SET @sql_alter_role_enum = '
ALTER TABLE `web_users`
MODIFY COLUMN `role` ENUM(
    ''ADMIN'',
    ''MANAGER'',
    ''CREATOR'',
    ''USER''
) NOT NULL DEFAULT ''USER'' COMMENT ''권한 등급'';
';

-- 실행 및 PREPARE
PREPARE stmt_alter_role_enum FROM @sql_alter_role_enum;
EXECUTE stmt_alter_role_enum;
DEALLOCATE PREPARE stmt_alter_role_enum;

-- 트랜잭션 커밋
COMMIT;

-- 변경사항 확인
SHOW COLUMNS FROM `web_users` LIKE 'block_reason';
SHOW COLUMNS FROM `web_users` LIKE 'blocked_at';
SHOW COLUMNS FROM `web_users` LIKE 'block_expires_at';
SHOW COLUMNS FROM `web_users` LIKE 'role';