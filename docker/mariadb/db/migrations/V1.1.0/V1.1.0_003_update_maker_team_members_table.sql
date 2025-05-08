-- Migration: V1.1.0_003_add_is_individual_to_maker_teams_table.sql
-- Description: maker_teams 테이블에 개인 팀 여부 컬럼(is_individual) 추가
-- Created: 2025-05-08 14:30:00
ALTER TABLE `maker_teams`
  ADD COLUMN `is_individual` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '개인 팀 여부'
    AFTER `name`;