-- V1.4.3_001: Convert Chat entities to use UUID BINARY(16) primary keys
-- Following Character.java pattern with @UuidGenerator and UUID primary keys

-- 1. Disable foreign key checks to allow table dropping
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Drop existing chat tables (기존 데이터 불필요하므로 DROP)
-- Drop in reverse dependency order to avoid FK constraint errors
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS vote_responses;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS voice_session_logs;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS channel_members;
DROP TABLE IF EXISTS server_roles;
DROP TABLE IF EXISTS server_members;
DROP TABLE IF EXISTS server_channels;
DROP TABLE IF EXISTS chat_servers;

-- Also drop related tables from previous voice chat implementation
DROP TABLE IF EXISTS voice_channels;
DROP TABLE IF EXISTS voice_permissions;
DROP TABLE IF EXISTS chat_channels;
DROP TABLE IF EXISTS voice_channel_settings;

-- Drop views
DROP VIEW IF EXISTS server_statistics;
DROP VIEW IF EXISTS channel_statistics;

-- 3. Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 4. Create ChatServer table with UUID primary key
CREATE TABLE chat_servers (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    name VARCHAR(100) NOT NULL COMMENT '서버명',
    description VARCHAR(500) COMMENT '서버 설명',
    password_hash VARCHAR(255) COMMENT 'BCrypt 해시 (선택적)',
    created_by BINARY(16) NOT NULL COMMENT '서버 생성자 User ID',
    max_members INT DEFAULT 100 COMMENT '최대 참여자 수',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete 시간',
    
    INDEX idx_chat_servers_created_by (created_by),
    INDEX idx_chat_servers_is_active (is_active),
    INDEX idx_chat_servers_created_at (created_at),
    INDEX idx_chat_servers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 서버 테이블 (UUID 기반)';

-- 5. Create ServerChannel table with UUID primary key
CREATE TABLE server_channels (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    name VARCHAR(100) NOT NULL COMMENT '채널명',
    description VARCHAR(500) COMMENT '채널 설명',
    channel_type ENUM('TEXT', 'VOICE', 'BOTH') DEFAULT 'BOTH' COMMENT '채널 타입',
    created_by BINARY(16) NOT NULL COMMENT '채널 생성자 User ID',
    max_members INT DEFAULT 50 COMMENT '최대 참여자 수',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete 시간',
    
    UNIQUE KEY unique_server_channel_name (server_id, name),
    INDEX idx_server_channels_server_id (server_id),
    INDEX idx_server_channels_created_by (created_by),
    INDEX idx_server_channels_is_active (is_active),
    INDEX idx_server_channels_created_at (created_at),
    INDEX idx_server_channels_name (name),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버 채널 테이블 (UUID 기반)';

-- 6. Create ServerMember table with UUID primary key
CREATE TABLE server_members (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    user_id BINARY(16) NOT NULL COMMENT '사용자 ID',
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER, ADMIN',
    display_name VARCHAR(50) COMMENT '서버별 닉네임',
    avatar_url VARCHAR(255) COMMENT '서버별 아바타',
    assigned_roles JSON COMMENT '할당된 ServerRole.id 배열',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입 시간',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 활동 시간',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    
    UNIQUE KEY unique_server_user (server_id, user_id),
    INDEX idx_server_members_user_id (user_id),
    INDEX idx_server_members_server_id (server_id),
    INDEX idx_server_members_role (role),
    INDEX idx_server_members_last_activity (last_activity_at),
    INDEX idx_server_members_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버 참여자 테이블 (UUID 기반)';

-- 7. Create ChannelMember table with UUID primary key
CREATE TABLE channel_members (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    user_id BINARY(16) NOT NULL COMMENT '사용자 ID',
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER, MODERATOR',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입 시간',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 활동 시간',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    
    UNIQUE KEY unique_channel_user (channel_id, user_id),
    INDEX idx_channel_members_user_id (user_id),
    INDEX idx_channel_members_channel_id (channel_id),
    INDEX idx_channel_members_role (role),
    INDEX idx_channel_members_last_activity (last_activity_at),
    INDEX idx_channel_members_is_active (is_active),
    
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채널 참여자 테이블 (UUID 기반)';

-- 8. Create ServerRole table with UUID primary key
CREATE TABLE server_roles (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    name VARCHAR(50) NOT NULL COMMENT '역할명',
    color VARCHAR(7) DEFAULT '#ffffff' COMMENT '역할 색상',
    permissions JSON NOT NULL COMMENT '권한 배열',
    position INT DEFAULT 0 COMMENT '역할 순서',
    created_by BINARY(16) NOT NULL COMMENT '생성자 User ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    
    UNIQUE KEY unique_server_role_name (server_id, name),
    INDEX idx_server_roles_server_id (server_id),
    INDEX idx_server_roles_created_by (created_by),
    INDEX idx_server_roles_is_active (is_active),
    INDEX idx_server_roles_position (position),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버별 커스텀 역할 테이블 (UUID 기반)';

-- 9. Create ChatMessage table with UUID primary key
CREATE TABLE chat_messages (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    user_id BINARY(16) NOT NULL COMMENT '사용자 ID',
    username VARCHAR(255) NOT NULL COMMENT '사용자명',
    content TEXT NOT NULL COMMENT '메시지 내용',
    message_type ENUM('TEXT', 'GIF', 'EMOJI') DEFAULT 'TEXT' COMMENT '메시지 타입',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    
    INDEX idx_chat_messages_server_id (server_id),
    INDEX idx_chat_messages_channel_id (channel_id),
    INDEX idx_chat_messages_user_id (user_id),
    INDEX idx_chat_messages_created_at (created_at),
    INDEX idx_chat_messages_server_channel_created_at (server_id, channel_id, created_at),
    INDEX idx_chat_messages_server_channel_user (server_id, channel_id, user_id),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 메시지 테이블 (UUID 기반)';

-- 10. Create VoiceSessionLog table with UUID primary key
CREATE TABLE voice_session_logs (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    user_id BINARY(16) NOT NULL COMMENT '사용자 ID',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '음성 세션 시작 시간',
    end_time TIMESTAMP NULL COMMENT '음성 세션 종료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    
    INDEX idx_voice_session_logs_server_id (server_id),
    INDEX idx_voice_session_logs_channel_id (channel_id),
    INDEX idx_voice_session_logs_user_id (user_id),
    INDEX idx_voice_session_logs_start_time (start_time),
    INDEX idx_voice_session_logs_server_channel (server_id, channel_id, start_time),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 세션 로그 테이블 (UUID 기반)';

-- 11. Create Vote table with UUID primary key
CREATE TABLE votes (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    question VARCHAR(500) NOT NULL COMMENT '투표 질문',
    options JSON NOT NULL COMMENT '투표 선택지 배열',
    created_by BINARY(16) NOT NULL COMMENT '생성자 User ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '투표 활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    expires_at TIMESTAMP NULL COMMENT '투표 종료 시간',
    
    INDEX idx_votes_server_id (server_id),
    INDEX idx_votes_channel_id (channel_id),
    INDEX idx_votes_created_by (created_by),
    INDEX idx_votes_created_at (created_at),
    INDEX idx_votes_server_channel_created_at (server_id, channel_id, created_at),
    INDEX idx_votes_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='투표 테이블 (UUID 기반)';

-- 12. Create VoteResponse table with UUID primary key
CREATE TABLE vote_responses (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    vote_id BINARY(16) NOT NULL COMMENT '투표 ID (FK)',
    user_id BINARY(16) NOT NULL COMMENT '응답자 User ID',
    selected_option VARCHAR(255) NOT NULL COMMENT '선택한 옵션',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '응답 시간',
    
    UNIQUE KEY unique_vote_user (vote_id, user_id),
    INDEX idx_vote_responses_vote_id (vote_id),
    INDEX idx_vote_responses_user_id (user_id),
    INDEX idx_vote_responses_created_at (created_at),
    
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='투표 응답 테이블 (UUID 기반)';

-- 13. Create Announcement table with UUID primary key
CREATE TABLE announcements (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    title VARCHAR(200) NOT NULL COMMENT '공지 제목',
    content TEXT NOT NULL COMMENT '공지 내용',
    created_by BINARY(16) NOT NULL COMMENT '생성자 User ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '공지 활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    expires_at TIMESTAMP NULL COMMENT '공지 만료 시간',
    
    INDEX idx_announcements_server_id (server_id),
    INDEX idx_announcements_channel_id (channel_id),
    INDEX idx_announcements_created_by (created_by),
    INDEX idx_announcements_created_at (created_at),
    INDEX idx_announcements_server_channel_created_at (server_id, channel_id, created_at),
    INDEX idx_announcements_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 테이블 (UUID 기반)';

-- 14. Create AudioFile table with UUID primary key
CREATE TABLE audio_files (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID primary key',
    server_id BINARY(16) NOT NULL COMMENT '서버 ID (FK)',
    channel_id BINARY(16) NOT NULL COMMENT '채널 ID (FK)',
    filename VARCHAR(255) NOT NULL COMMENT '파일명',
    original_name VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME 타입',
    uploaded_by BINARY(16) NOT NULL COMMENT '업로드한 User ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '파일 활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '업로드 시간',
    
    INDEX idx_audio_files_server_id (server_id),
    INDEX idx_audio_files_channel_id (channel_id),
    INDEX idx_audio_files_uploaded_by (uploaded_by),
    INDEX idx_audio_files_created_at (created_at),
    INDEX idx_audio_files_server_channel_created_at (server_id, channel_id, created_at),
    INDEX idx_audio_files_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='오디오 파일 테이블 (UUID 기반)';

-- 15. Create default test server and channel with proper UUIDs
INSERT INTO chat_servers (id, name, description, password_hash, created_by, created_at) 
VALUES (
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')), 
    'General Server', 
    '기본 테스트 서버입니다', 
    '$2a$10$defaultpasswordhash', 
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000000', '-', '')), 
    NOW()
);

INSERT INTO server_channels (id, server_id, name, description, channel_type, created_by, created_at) 
VALUES (
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')),
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')),
    'general', 
    '기본 테스트 채널입니다', 
    'BOTH', 
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000000', '-', '')), 
    NOW()
);

-- 16. Create default roles for test server
INSERT INTO server_roles (id, server_id, name, color, permissions, created_by, created_at)
VALUES 
(
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')),
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')),
    'Admin', 
    '#ff0000', 
    JSON_ARRAY('canManageServer', 'canManageChannels', 'canManageRoles', 'canKickMembers', 'canSendMessages', 'canUseVoice'), 
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000000', '-', '')), 
    NOW()
),
(
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000002', '-', '')),
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000001', '-', '')),
    'Member', 
    '#ffffff', 
    JSON_ARRAY('canSendMessages', 'canUseVoice'), 
    UNHEX(REPLACE('00000000-0000-4000-8000-000000000000', '-', '')), 
    NOW()
);

-- Migration completion notice
-- This migration completely rebuilds chat system with UUID BINARY(16) primary keys
-- following Character.java pattern with @UuidGenerator
-- All existing data is intentionally dropped as requested