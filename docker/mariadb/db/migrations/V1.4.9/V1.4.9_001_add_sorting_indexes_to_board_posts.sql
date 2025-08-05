-- V1.4.9_001_add_sorting_indexes_to_board_posts.sql
-- board_posts 테이블에 정렬 성능 향상을 위한 인덱스 추가

USE discord;

START TRANSACTION;

-- views 컬럼에 내림차순 인덱스 추가 (조회수순 정렬용)
CREATE INDEX IF NOT EXISTS `idx_board_posts_views_desc` ON `board_posts` (`views` DESC);

-- likes 컬럼에 내림차순 인덱스 추가 (추천순 정렬용)
CREATE INDEX IF NOT EXISTS `idx_board_posts_likes_desc` ON `board_posts` (`likes` DESC);

-- 복합 인덱스 추가: board_type, is_deleted, views (필터링 + 정렬 최적화)
CREATE INDEX IF NOT EXISTS `idx_board_posts_type_deleted_views` ON `board_posts` (`board_type`, `is_deleted`, `views` DESC);

-- 복합 인덱스 추가: board_type, is_deleted, likes (필터링 + 정렬 최적화)
CREATE INDEX IF NOT EXISTS `idx_board_posts_type_deleted_likes` ON `board_posts` (`board_type`, `is_deleted`, `likes` DESC);

COMMIT;