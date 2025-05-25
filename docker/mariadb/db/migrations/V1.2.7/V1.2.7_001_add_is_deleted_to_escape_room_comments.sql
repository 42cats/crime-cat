-- V1.2.7_001: Add is_deleted field to escape room comments table
-- This migration adds a soft delete indicator field to support parent comment preservation when child comments exist

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- 1. Add is_deleted column to escape_room_comments table
ALTER TABLE escape_room_comments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE 
COMMENT 'Indicates if the comment content is deleted but structure preserved for child comments'
AFTER deleted_at;

-- 2. Create index for efficient querying of non-deleted comments
CREATE INDEX IF NOT EXISTS idx_escape_room_comment_is_deleted 
ON escape_room_comments (is_deleted, escape_room_theme_id, deleted_at);

-- 3. Update existing deleted comments to set is_deleted flag
-- This ensures consistency for any comments that were already soft deleted
UPDATE escape_room_comments 
SET is_deleted = TRUE 
WHERE deleted_at IS NOT NULL;

-- Commit transaction
COMMIT;