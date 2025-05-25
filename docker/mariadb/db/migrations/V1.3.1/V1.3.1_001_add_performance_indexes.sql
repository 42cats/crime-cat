-- Migration: V1.3.1_001_add_performance_indexes.sql
-- Created: 2025-05-26
-- Add performance optimization indexes to improve query performance

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- 1) Add index for game_histories table
-- Optimizes queries filtering by guild_snowflake and ordering by created_at
CREATE INDEX IF NOT EXISTS `idx_game_histories_guild_created` 
    ON `game_histories` (`guild_snowflake`, `created_at`);

-- 2) Add index for comments table
-- Optimizes queries filtering by game_theme_id, parent_id, and is_deleted status
CREATE INDEX IF NOT EXISTS `idx_comments_theme_parent` 
    ON `comments` (`game_theme_id`, `parent_id`, `is_deleted`);

-- 3) Add index for notifications table
-- Optimizes queries filtering by receiver_id, status, and ordering by created_at
CREATE INDEX IF NOT EXISTS `idx_notifications_receiver` 
    ON `notifications` (`receiver_id`, `status`, `created_at`);

-- 4) Add index for board_posts table
-- Optimizes queries filtering by board_type, post_type, is_deleted and ordering
CREATE INDEX IF NOT EXISTS `idx_board_posts_type_deleted_created` 
    ON `board_posts` (`board_type`, `post_type`, `is_deleted`, `created_at` DESC);

-- 5) Add index for user_posts table
-- Optimizes queries filtering by privacy settings and ordering by created_at
CREATE INDEX IF NOT EXISTS `idx_user_posts_private_created` 
    ON `user_posts` (`is_private`, `is_followers_only`, `created_at` DESC);

-- 6) Add index for user_permissions table
-- Optimizes permission lookups by user_snowflake
CREATE INDEX IF NOT EXISTS `idx_user_permissions_user` 
    ON `user_permissions` (`user_snowflake`, `permission_id`);

-- 7) Add index for game_themes table
-- Optimizes queries filtering by type and is_public
CREATE INDEX IF NOT EXISTS `idx_game_themes_type_public` 
    ON `game_themes` (`type`, `is_public`);

-- 8) Add index for escape_room_histories table
-- Optimizes queries by web_user_id and created_at
CREATE INDEX IF NOT EXISTS `idx_escape_room_historys_user_created` 
    ON `escape_room_historys` (`web_user_id`, `created_at` DESC);

-- 9) Add index for post_comments table
-- Optimizes queries filtering by post_id and parent_id
CREATE INDEX IF NOT EXISTS `idx_post_comments_post_parent` 
    ON `post_comments` (`post_id`, `parent_id`);

-- 10) Add index for user_post_comments table
-- Optimizes queries filtering by user_post_id and parent_id
CREATE INDEX IF NOT EXISTS `idx_user_post_comments_post_parent` 
    ON `user_post_comments` (`user_post_id`, `parent_id`);

-- Commit transaction
COMMIT;