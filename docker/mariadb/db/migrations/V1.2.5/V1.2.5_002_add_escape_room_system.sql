-- V1.2.5_002: Add escape room theme system with normalized tables
-- This migration adds all tables and modifications for escape room theme support

USE discord;

-- Start transaction for atomic changes
START TRANSACTION;

-- 1. Create escape_room_themes table (Main theme table with JPA JOINED inheritance)
CREATE TABLE IF NOT EXISTS escape_room_themes (
    id BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자 (GameTheme과 동일한 PK)',
    horror_level INT COMMENT '공포도 (1-10, 별 5개 표시용)',
    device_ratio INT COMMENT '장치비중 (1-10, 별 5개 표시용)',
    activity_level INT COMMENT '활동도 (1-10, 별 5개 표시용)',
    open_date DATE COMMENT '오픈날짜',
    is_operating BOOLEAN NOT NULL DEFAULT TRUE COMMENT '현재 운용여부',
    extra LONGTEXT COMMENT '추가 정보 (JSON)' CHECK (JSON_VALID(extra)),
    
    CONSTRAINT fk_escape_room_game_theme FOREIGN KEY (id) 
        REFERENCES game_themes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 테마 테이블 (JPA JOINED 상속)';

-- 2. Create escape_room_locations table
CREATE TABLE IF NOT EXISTS escape_room_locations (
    id BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    escape_room_theme_id BINARY(16) NOT NULL COMMENT '방탈출 테마 ID',
    store_name VARCHAR(100) NOT NULL COMMENT '매장명',
    address TEXT NOT NULL COMMENT '주소',
    road_address TEXT COMMENT '도로명 주소',
    latitude DECIMAL(10, 8) COMMENT '위도',
    longitude DECIMAL(11, 8) COMMENT '경도',
    naver_link VARCHAR(500) COMMENT '네이버 지도 링크',
    phone VARCHAR(20) COMMENT '전화번호',
    description TEXT COMMENT '설명',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_escape_room_location_theme FOREIGN KEY (escape_room_theme_id) 
        REFERENCES escape_room_themes(id) ON DELETE CASCADE,
    INDEX idx_escape_room_location_coordinates (latitude, longitude),
    INDEX idx_escape_room_location_theme (escape_room_theme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 지점 테이블';

-- 3. Create escape_room_genre_tags table
CREATE TABLE IF NOT EXISTS escape_room_genre_tags (
    id BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    escape_room_theme_id BINARY(16) NOT NULL COMMENT '방탈출 테마 ID',
    tag_name VARCHAR(50) NOT NULL COMMENT '장르 태그명',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_escape_room_genre_theme FOREIGN KEY (escape_room_theme_id) 
        REFERENCES escape_room_themes(id) ON DELETE CASCADE,
    INDEX idx_escape_room_genre_tag_name (tag_name),
    INDEX idx_escape_room_genre_theme (escape_room_theme_id),
    UNIQUE KEY uk_escape_room_theme_tag (escape_room_theme_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 장르 태그 테이블';

-- 4. Create escape_room_historys table
CREATE TABLE IF NOT EXISTS escape_room_historys (
    id BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    escape_room_theme_id BINARY(16) NOT NULL COMMENT '방탈출 테마 ID',
    escape_room_location_id BINARY(16) COMMENT '방탈출 지점 ID',
    web_user_id BINARY(16) NOT NULL COMMENT '웹 사용자 ID',
    team_size INT NOT NULL COMMENT '팀 인원수',
    success_status ENUM('SUCCESS', 'FAIL', 'PARTIAL') NOT NULL COMMENT '성공 여부',
    clear_time INT COMMENT '클리어 시간 (분)',
    hint_count INT DEFAULT 0 COMMENT '힌트 사용 횟수',
    difficulty_rating INT COMMENT '난이도 평점 (1-5)',
    fun_rating INT COMMENT '재미 평점 (1-5)',
    story_rating INT COMMENT '스토리 평점 (1-5)',
    play_date DATE NOT NULL COMMENT '플레이 날짜',
    memo TEXT COMMENT '플레이 후기',
    is_spoiler BOOLEAN NOT NULL DEFAULT FALSE COMMENT '스포일러 포함 여부',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_escape_room_historys_theme FOREIGN KEY (escape_room_theme_id) 
        REFERENCES escape_room_themes(id) ON DELETE CASCADE,
    CONSTRAINT fk_escape_room_historys_location FOREIGN KEY (escape_room_location_id) 
        REFERENCES escape_room_locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_escape_room_historys_user FOREIGN KEY (web_user_id) 
        REFERENCES web_users(id) ON DELETE CASCADE,
    INDEX idx_escape_room_historys_theme (escape_room_theme_id),
    INDEX idx_escape_room_historys_user (web_user_id),
    INDEX idx_escape_room_historys_date (play_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 플레이 기록 테이블';

-- 5. Create escape_room_comments table
CREATE TABLE IF NOT EXISTS escape_room_comments (
    id BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    escape_room_theme_id BINARY(16) NOT NULL COMMENT '방탈출 테마 ID',
    escape_room_historys_id BINARY(16) COMMENT '방탈출 기록 ID (기록 기반 댓글)',
    web_user_id BINARY(16) NOT NULL COMMENT '작성자 ID',
    content TEXT NOT NULL COMMENT '댓글 내용',
    is_spoiler BOOLEAN NOT NULL DEFAULT FALSE COMMENT '스포일러 포함 여부',
    parent_comment_id BINARY(16) COMMENT '부모 댓글 ID (대댓글용)',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_escape_room_comment_theme FOREIGN KEY (escape_room_theme_id) 
        REFERENCES escape_room_themes(id) ON DELETE CASCADE,
    CONSTRAINT fk_escape_room_comment_history FOREIGN KEY (escape_room_historys_id) 
        REFERENCES escape_room_historys(id) ON DELETE CASCADE,
    CONSTRAINT fk_escape_room_comment_user FOREIGN KEY (web_user_id) 
        REFERENCES web_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_escape_room_comment_parent FOREIGN KEY (parent_comment_id) 
        REFERENCES escape_room_comments(id) ON DELETE CASCADE,
    INDEX idx_escape_room_comment_theme (escape_room_theme_id),
    INDEX idx_escape_room_comment_history (escape_room_historys_id),
    INDEX idx_escape_room_comment_user (web_user_id),
    INDEX idx_escape_room_comment_parent (parent_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='방탈출 댓글 테이블';

-- 6. Ensure game_themes table type enum includes ESCAPE_ROOM
SET @escape_room_enum_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = 'discord' AND table_name = 'game_themes' 
    AND column_name = 'type' AND column_type LIKE '%ESCAPE_ROOM%');

SET @alter_game_themes_enum = IF(@escape_room_enum_exists = 0,
    'ALTER TABLE game_themes MODIFY COLUMN type ENUM(''CRIMESCENE'', ''ESCAPE_ROOM'', ''MURDER_MYSTERY'', ''REALWORLD'') NOT NULL COMMENT ''테마 타입''',
    'SELECT 1');

PREPARE stmt_enum FROM @alter_game_themes_enum;
EXECUTE stmt_enum;
DEALLOCATE PREPARE stmt_enum;

-- 7. Create additional indexes for performance optimization
-- Index for genre tag search optimization
SET @escape_room_search_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'discord' AND table_name = 'escape_room_genre_tags'
    AND index_name = 'idx_escape_room_search_optimization');

SET @create_search_index = IF(@escape_room_search_index_exists = 0,
    'CREATE INDEX idx_escape_room_search_optimization ON escape_room_genre_tags (tag_name, escape_room_theme_id)',
    'SELECT 1');

PREPARE stmt_search_idx FROM @create_search_index;
EXECUTE stmt_search_idx;
DEALLOCATE PREPARE stmt_search_idx;

-- Index for location-based searches
SET @location_search_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'discord' AND table_name = 'escape_room_locations'
    AND index_name = 'idx_escape_room_location_search');

SET @create_location_index = IF(@location_search_index_exists = 0,
    'CREATE INDEX idx_escape_room_location_search ON escape_room_locations (escape_room_theme_id)',
    'SELECT 1');

PREPARE stmt_location_idx FROM @create_location_index;
EXECUTE stmt_location_idx;
DEALLOCATE PREPARE stmt_location_idx;

-- Index for history statistics
SET @history_stats_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'discord' AND table_name = 'escape_room_historys'
    AND index_name = 'idx_escape_room_historys_stats');

SET @create_history_index = IF(@history_stats_index_exists = 0,
    'CREATE INDEX idx_escape_room_historys_stats ON escape_room_historys (escape_room_theme_id, success_status, play_date)',
    'SELECT 1');

PREPARE stmt_history_idx FROM @create_history_index;
EXECUTE stmt_history_idx;
DEALLOCATE PREPARE stmt_history_idx;

-- Commit transaction
COMMIT;