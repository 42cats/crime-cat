-- V1.4.8_001_add_event_to_post_type_enum.sql
-- board_posts 테이블의 post_type enum에 EVENT 추가

USE discord;

START TRANSACTION;

-- post_type enum에 EVENT 추가
ALTER TABLE `board_posts` 
MODIFY COLUMN `post_type` enum('GENERAL', 'QUESTION', 'PHOTO', 'SECRET', 'PROMOTION', 'RECRUIT', 'CRIME_SCENE', 'MURDER_MYSTERY', 'ESCAPE_ROOM', 'REAL_WORLD', 'EVENT') NOT NULL;

COMMIT;