-- V1.2.6_001: Remove escape room genre tags table
-- This migration removes the genre tags table as we're using the existing tags field in game_themes table

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- 1. Drop foreign key constraints first
ALTER TABLE escape_room_genre_tags DROP FOREIGN KEY IF EXISTS fk_escape_room_genre_theme;

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_escape_room_genre_tag_name ON escape_room_genre_tags;
DROP INDEX IF EXISTS idx_escape_room_genre_theme ON escape_room_genre_tags;
DROP INDEX IF EXISTS idx_escape_room_search_optimization ON escape_room_genre_tags;

-- 3. Drop the escape_room_genre_tags table
DROP TABLE IF EXISTS escape_room_genre_tags;

-- Commit transaction
COMMIT;
