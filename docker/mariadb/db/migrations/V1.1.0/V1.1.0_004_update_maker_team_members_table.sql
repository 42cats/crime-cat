-- Migration: V1.1.0_004_update_maker_team_members_table.sql
-- Description: maker_team_members 테이블의 user_id → web_user_id로 변경하고 팀장 여부(is_leader) 컬럼 추가
-- Created: 2025-05-08 14:30:00
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `maker_team_members`
  DROP FOREIGN KEY `fk_user_id`,
  DROP COLUMN `user_id`,
  ADD COLUMN `web_user_id` BINARY(16) NULL
    COMMENT '웹 유저 아이디'
    AFTER `name`,
  ADD COLUMN `is_leader` BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT '팀장 여부'
    AFTER `web_user_id`,
  ADD CONSTRAINT `fk_web_user_id`
    FOREIGN KEY (`web_user_id`) REFERENCES `web_users`(`id`)
      ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
