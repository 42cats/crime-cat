-- Migration: V1.1.0_001_add_emai_alret_on_web_user_table.sql
-- Description: 웹유저에 이메일 알림 설정여부 추가
-- Created: 2025-05-08 14:30:00

USE ${DB_DISCORD};

ALTER TABLE `web_users`
  ADD COLUMN `email_alarm` BIT(1) NOT NULL DEFAULT b'0'
    COMMENT '이메일 수신설정'
    AFTER `social_links`;