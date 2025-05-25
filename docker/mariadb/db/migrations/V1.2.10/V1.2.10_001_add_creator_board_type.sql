-- V1.2.10_001_add_creator_board_type.sql
-- board_posts 테이블의 board_type enum에 CREATOR 추가

USE discord;

START TRANSACTION;

-- board_type enum에 CREATOR 추가
ALTER TABLE `board_posts` 
MODIFY COLUMN `board_type` enum('CHAT', 'QUESTION', 'CREATOR', 'NONE') NOT NULL;

COMMIT;