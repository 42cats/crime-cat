-- Migration: V1.1.0_003_update_maker_team_members_table.sql
-- Description: maker_team_members 테이블에 필요한 변경 사항 적용
-- Created: 2025-05-08 14:30:00
USE ${DB_DISCORD};
START TRANSACTION;

-- 테이블이 존재하는지 확인
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                   WHERE table_schema = '${DB_DISCORD}' AND table_name = 'maker_team_members');

-- 테이블이 존재하고 필요한 열이 없는 경우에만 실행
SET @user_id_exists = IF(@table_exists > 0, 
                      (SELECT COUNT(*) FROM information_schema.columns 
                       WHERE table_schema = '${DB_DISCORD}' AND table_name = 'maker_team_members' 
                       AND column_name = 'user_id'), 0);

SET @web_user_id_exists = IF(@table_exists > 0, 
                          (SELECT COUNT(*) FROM information_schema.columns 
                           WHERE table_schema = '${DB_DISCORD}' AND table_name = 'maker_team_members' 
                           AND column_name = 'web_user_id'), 0);

SET @is_leader_exists = IF(@table_exists > 0, 
                        (SELECT COUNT(*) FROM information_schema.columns 
                         WHERE table_schema = '${DB_DISCORD}' AND table_name = 'maker_team_members' 
                         AND column_name = 'is_leader'), 0);

-- 변경 SQL 생성 및 실행
SET @update_sql = IF(@table_exists > 0 AND @user_id_exists > 0 AND @web_user_id_exists = 0,
'ALTER TABLE `maker_team_members`
  DROP FOREIGN KEY IF EXISTS `fk_user_id`,
  DROP COLUMN `user_id`,
  ADD COLUMN `web_user_id` BINARY(16) NULL COMMENT "웹 유저 아이디" AFTER `name`,
  ADD COLUMN `is_leader` BOOLEAN NOT NULL DEFAULT FALSE COMMENT "팀장 여부" AFTER `web_user_id`,
  ADD CONSTRAINT `fk_web_user_id` FOREIGN KEY (`web_user_id`) REFERENCES `web_users`(`id`) ON DELETE CASCADE',
'SELECT "maker_team_members 테이블이 존재하지 않거나 이미 열이 업데이트되었습니다" AS message');

SET FOREIGN_KEY_CHECKS=0;
PREPARE stmt FROM @update_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET FOREIGN_KEY_CHECKS=1;

COMMIT;