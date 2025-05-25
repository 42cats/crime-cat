-- Migration: V1.2.9_002_add_theme_point_reward_notifications.sql
-- Created: 2025-01-27 
-- Add THEME_POINT_REWARD to notifications type enum

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- Add THEME_POINT_REWARD to notifications type enum
ALTER TABLE `notifications` 
MODIFY COLUMN `type` enum(
    'FRIEND_REQUEST',
    'GAME_NOTICE',
    'COMMENT_ALERT',
    'SYSTEM_NOTICE',
    'NEW_THEME',
    'GAME_RECORD_REQUEST',
    'USER_POST_NEW',
    'USER_POST_COMMENT',
    'USER_POST_COMMENT_REPLY',
    'THEME_POINT_REWARD'
) NOT NULL COMMENT '알림 타입';

-- Commit transaction
COMMIT;
