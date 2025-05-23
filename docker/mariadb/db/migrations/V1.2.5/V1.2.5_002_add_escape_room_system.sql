-- V1.2.5_002: Add escape room theme system with normalized tables
-- This migration adds all tables and modifications for escape room theme support

USE ${DB_DISCORD};

-- Start transaction for atomic changes
START TRANSACTION;

-- 1. Create escape_room_themes table
SET @escape_room_themes_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_themes');

SET @create_escape_room_themes = IF(@escape_room_themes_exists = 0,
    'CREATE TABLE escape_room_themes (
        id BINARY(16) PRIMARY KEY COMMENT ''내부 고유 식별자'',
        game_theme_id BINARY(16) NOT NULL COMMENT ''게임 테마 ID'',
        maker_team_id BINARY(16) COMMENT ''제작 팀 ID'',
        company_name VARCHAR(100) COMMENT ''업체명'',
        extra LONGTEXT COMMENT ''추가 정보 (JSON)'' CHECK (JSON_VALID(extra)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_escape_room_game_theme FOREIGN KEY (game_theme_id) 
            REFERENCES game_themes(id) ON DELETE CASCADE,
        CONSTRAINT fk_escape_room_maker_team FOREIGN KEY (maker_team_id) 
            REFERENCES maker_teams(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT=''방탈출 테마 테이블''',
    'DO 0'
);

PREPARE stmt1 FROM @create_escape_room_themes;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- 2. Create escape_room_locations table
SET @escape_room_locations_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_locations');

SET @create_escape_room_locations = IF(@escape_room_locations_exists = 0,
    'CREATE TABLE escape_room_locations (
        id BINARY(16) PRIMARY KEY COMMENT ''내부 고유 식별자'',
        escape_room_theme_id BINARY(16) NOT NULL COMMENT ''방탈출 테마 ID'',
        name VARCHAR(100) NOT NULL COMMENT ''지점명'',
        address TEXT NOT NULL COMMENT ''주소'',
        latitude DECIMAL(10, 8) COMMENT ''위도'',
        longitude DECIMAL(11, 8) COMMENT ''경도'',
        phone VARCHAR(20) COMMENT ''전화번호'',
        operating_hours TEXT COMMENT ''운영시간'',
        is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT ''운영 여부'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_escape_room_location_theme FOREIGN KEY (escape_room_theme_id) 
            REFERENCES escape_room_themes(id) ON DELETE CASCADE,
        INDEX idx_escape_room_location_coordinates (latitude, longitude),
        INDEX idx_escape_room_location_theme (escape_room_theme_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT=''방탈출 지점 테이블''',
    'DO 0'
);

PREPARE stmt2 FROM @create_escape_room_locations;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Create escape_room_genre_tags table
SET @escape_room_genre_tags_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_genre_tags');

SET @create_escape_room_genre_tags = IF(@escape_room_genre_tags_exists = 0,
    'CREATE TABLE escape_room_genre_tags (
        id BINARY(16) PRIMARY KEY COMMENT ''내부 고유 식별자'',
        escape_room_theme_id BINARY(16) NOT NULL COMMENT ''방탈출 테마 ID'',
        tag_name VARCHAR(50) NOT NULL COMMENT ''장르 태그명'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_escape_room_genre_theme FOREIGN KEY (escape_room_theme_id) 
            REFERENCES escape_room_themes(id) ON DELETE CASCADE,
        INDEX idx_escape_room_genre_tag_name (tag_name),
        INDEX idx_escape_room_genre_theme (escape_room_theme_id),
        UNIQUE KEY uk_escape_room_theme_tag (escape_room_theme_id, tag_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT=''방탈출 장르 태그 테이블''',
    'DO 0'
);

PREPARE stmt3 FROM @create_escape_room_genre_tags;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- 4. Create escape_room_history table
SET @escape_room_history_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_history');

SET @create_escape_room_history = IF(@escape_room_history_exists = 0,
    'CREATE TABLE escape_room_history (
        id BINARY(16) PRIMARY KEY COMMENT ''내부 고유 식별자'',
        escape_room_theme_id BINARY(16) NOT NULL COMMENT ''방탈출 테마 ID'',
        escape_room_location_id BINARY(16) COMMENT ''방탈출 지점 ID'',
        web_user_id BINARY(16) NOT NULL COMMENT ''웹 사용자 ID'',
        team_size INT NOT NULL COMMENT ''팀 인원수'',
        success_status ENUM(''SUCCESS'', ''FAIL'', ''PARTIAL'') NOT NULL COMMENT ''성공 여부'',
        clear_time INT COMMENT ''클리어 시간 (분)'',
        hint_count INT DEFAULT 0 COMMENT ''힌트 사용 횟수'',
        difficulty_rating INT COMMENT ''난이도 평점 (1-5)'',
        fun_rating INT COMMENT ''재미 평점 (1-5)'',
        story_rating INT COMMENT ''스토리 평점 (1-5)'',
        play_date DATE NOT NULL COMMENT ''플레이 날짜'',
        memo TEXT COMMENT ''플레이 후기'',
        is_spoiler BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''스포일러 포함 여부'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_escape_room_history_theme FOREIGN KEY (escape_room_theme_id) 
            REFERENCES escape_room_themes(id) ON DELETE CASCADE,
        CONSTRAINT fk_escape_room_history_location FOREIGN KEY (escape_room_location_id) 
            REFERENCES escape_room_locations(id) ON DELETE SET NULL,
        CONSTRAINT fk_escape_room_history_user FOREIGN KEY (web_user_id) 
            REFERENCES web_users(id) ON DELETE CASCADE,
        INDEX idx_escape_room_history_theme (escape_room_theme_id),
        INDEX idx_escape_room_history_user (web_user_id),
        INDEX idx_escape_room_history_date (play_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT=''방탈출 플레이 기록 테이블''',
    'DO 0'
);

PREPARE stmt4 FROM @create_escape_room_history;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- 5. Create escape_room_comments table
SET @escape_room_comments_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_comments');

SET @create_escape_room_comments = IF(@escape_room_comments_exists = 0,
    'CREATE TABLE escape_room_comments (
        id BINARY(16) PRIMARY KEY COMMENT ''내부 고유 식별자'',
        escape_room_theme_id BINARY(16) NOT NULL COMMENT ''방탈출 테마 ID'',
        escape_room_history_id BINARY(16) COMMENT ''방탈출 기록 ID (기록 기반 댓글)'',
        web_user_id BINARY(16) NOT NULL COMMENT ''작성자 ID'',
        content TEXT NOT NULL COMMENT ''댓글 내용'',
        is_spoiler BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''스포일러 포함 여부'',
        parent_comment_id BINARY(16) COMMENT ''부모 댓글 ID (대댓글용)'',
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''삭제 여부'',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_escape_room_comment_theme FOREIGN KEY (escape_room_theme_id) 
            REFERENCES escape_room_themes(id) ON DELETE CASCADE,
        CONSTRAINT fk_escape_room_comment_history FOREIGN KEY (escape_room_history_id) 
            REFERENCES escape_room_history(id) ON DELETE CASCADE,
        CONSTRAINT fk_escape_room_comment_user FOREIGN KEY (web_user_id) 
            REFERENCES web_users(id) ON DELETE CASCADE,
        CONSTRAINT fk_escape_room_comment_parent FOREIGN KEY (parent_comment_id) 
            REFERENCES escape_room_comments(id) ON DELETE CASCADE,
        INDEX idx_escape_room_comment_theme (escape_room_theme_id),
        INDEX idx_escape_room_comment_history (escape_room_history_id),
        INDEX idx_escape_room_comment_user (web_user_id),
        INDEX idx_escape_room_comment_parent (parent_comment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
    COMMENT=''방탈출 댓글 테이블''',
    'DO 0'
);

PREPARE stmt5 FROM @create_escape_room_comments;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- 6. Update game_themes table type enum to include ESCAPE_ROOM if not exists
SET @escape_room_enum_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_themes' 
    AND column_name = 'type' AND column_type LIKE '%ESCAPE_ROOM%');

SET @alter_game_themes_enum = IF(@escape_room_enum_exists = 0,
    'ALTER TABLE game_themes MODIFY COLUMN type ENUM(''CRIMESCENE'', ''ESCAPE_ROOM'', ''MURDER_MYSTERY'', ''REALWORLD'') NOT NULL COMMENT ''테마 타입''',
    'DO 0'
);

PREPARE stmt6 FROM @alter_game_themes_enum;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- 7. Create additional indexes for performance optimization
SET @escape_room_search_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_genre_tags'
    AND index_name = 'idx_escape_room_search_optimization');

SET @create_search_index = IF(@escape_room_search_index_exists = 0,
    'CREATE INDEX idx_escape_room_search_optimization ON escape_room_genre_tags (tag_name, escape_room_theme_id)',
    'DO 0'
);

PREPARE stmt7 FROM @create_search_index;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

-- 8. Create composite index for location-based searches
SET @location_search_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_locations'
    AND index_name = 'idx_escape_room_location_search');

SET @create_location_index = IF(@location_search_index_exists = 0,
    'CREATE INDEX idx_escape_room_location_search ON escape_room_locations (is_active, escape_room_theme_id)',
    'DO 0'
);

PREPARE stmt8 FROM @create_location_index;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

-- 9. Create index for history statistics
SET @history_stats_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'escape_room_history'
    AND index_name = 'idx_escape_room_history_stats');

SET @create_history_index = IF(@history_stats_index_exists = 0,
    'CREATE INDEX idx_escape_room_history_stats ON escape_room_history (escape_room_theme_id, success_status, play_date)',
    'DO 0'
);

PREPARE stmt9 FROM @create_history_index;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

-- Commit transaction
COMMIT;