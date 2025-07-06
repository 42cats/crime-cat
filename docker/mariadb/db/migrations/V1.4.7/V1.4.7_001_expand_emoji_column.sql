-- V1.4.7_001: 이모지 컬럼 크기 확장 (최대 5개 이모지 지원)
-- 작성자: Claude Code
-- 작성일: 2025-07-06
-- 목적: emoji 컬럼을 100자에서 500자로 확장하여 최대 5개의 이모지를 콤마로 구분하여 저장 가능하도록 함

ALTER TABLE `group_items` 
MODIFY COLUMN `emoji` varchar(500) DEFAULT NULL COMMENT 'Emoji for button/content display (Unicode or Discord custom emoji format, comma-separated for multiple emojis)';