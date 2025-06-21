-- V1.4.4_001: Simplify channel types to TEXT and VOICE only (remove BOTH type)
-- Discord-style voice chat implementation

-- Step 1: Update existing BOTH type channels to TEXT
UPDATE server_channels 
SET channel_type = 'TEXT' 
WHERE channel_type = 'BOTH';

-- Step 2: Modify the column to only allow TEXT and VOICE
ALTER TABLE server_channels 
MODIFY COLUMN channel_type ENUM('TEXT', 'VOICE') NOT NULL DEFAULT 'TEXT';

-- Step 3: Update default value for new channels
ALTER TABLE server_channels 
ALTER COLUMN channel_type SET DEFAULT 'TEXT';