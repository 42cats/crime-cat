-- V1.4.10_001_add_notice_to_post_type_enum.sql
-- board_posts 테이블의 post_type enum에 NOTICE 추가

USE discord;

START TRANSACTION;

-- post_type enum에 NOTICE 추가
ALTER TABLE `board_posts` 
MODIFY COLUMN `post_type` enum('GENERAL', 'QUESTION', 'PHOTO', 'SECRET', 'PROMOTION', 'RECRUIT', 'CRIME_SCENE', 'MURDER_MYSTERY', 'ESCAPE_ROOM', 'REAL_WORLD', 'EVENT', 'NOTICE') NOT NULL;

COMMIT;