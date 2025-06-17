-- V1.4.1_001: Server-Channel Hierarchy with Password Protection
-- Server has password protection, Channels are role-based within servers

-- 1. Create ChatServer table (password protected)
CREATE TABLE chat_servers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '서버명',
    description VARCHAR(500) COMMENT '서버 설명',
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt 해시 (필수)',
    created_by BINARY(16) NOT NULL COMMENT '서버 생성자 User ID',
    max_members INT DEFAULT 100 COMMENT '최대 참여자 수',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete 시간',
    
    INDEX idx_chat_servers_created_by (created_by),
    INDEX idx_chat_servers_is_active (is_active),
    INDEX idx_chat_servers_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 서버 테이블 (비밀번호 보호)';

-- 2. Create ServerMember table (server membership with roles)
CREATE TABLE server_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id BIGINT NOT NULL,
    user_id BINARY(16) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER, ADMIN',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    
    UNIQUE KEY unique_server_user (server_id, user_id),
    INDEX idx_server_members_user_id (user_id),
    INDEX idx_server_members_server_id (server_id),
    INDEX idx_server_members_role (role),
    INDEX idx_server_members_last_activity (last_activity_at),
    INDEX idx_server_members_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버 참여자 테이블';

-- 3. Create ServerChannel table (no password, role-based access)
CREATE TABLE server_channels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT '채널명',
    description VARCHAR(500) COMMENT '채널 설명',
    channel_type ENUM('TEXT', 'VOICE', 'BOTH') DEFAULT 'BOTH' COMMENT '채널 타입',
    created_by BINARY(16) NOT NULL COMMENT '채널 생성자 User ID',
    max_members INT DEFAULT 50 COMMENT '최대 참여자 수',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete 시간',
    
    UNIQUE KEY unique_server_channel_name (server_id, name),
    INDEX idx_server_channels_server_id (server_id),
    INDEX idx_server_channels_created_by (created_by),
    INDEX idx_server_channels_is_active (is_active),
    INDEX idx_server_channels_created_at (created_at),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버 채널 테이블 (권한 기반)';

-- 4. Create ChannelMember table (channel participation with roles)
CREATE TABLE channel_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL,
    user_id BINARY(16) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER, MODERATOR',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    
    UNIQUE KEY unique_channel_user (channel_id, user_id),
    INDEX idx_channel_members_user_id (user_id),
    INDEX idx_channel_members_channel_id (channel_id),
    INDEX idx_channel_members_role (role),
    INDEX idx_channel_members_last_activity (last_activity_at),
    INDEX idx_channel_members_is_active (is_active),
    
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채널 참여자 테이블';

-- 5. Modify existing ChatMessage table to include server_id and channel_id
ALTER TABLE chat_messages 
ADD COLUMN server_id BIGINT NOT NULL DEFAULT 1 COMMENT '서버 ID',
ADD COLUMN channel_id BIGINT NOT NULL DEFAULT 1 COMMENT '채널 ID';

-- 6. Create default server and channel
INSERT INTO chat_servers (id, name, description, password_hash, created_by, created_at) 
VALUES (1, 'General Server', '기본 서버입니다', '$2a$10$defaultpassword', UNHEX(REPLACE('00000000-0000-0000-0000-000000000000', '-', '')), NOW());

INSERT INTO server_channels (id, server_id, name, description, channel_type, created_by, created_at) 
VALUES (1, 1, 'general', '기본 채널입니다', 'BOTH', UNHEX(REPLACE('00000000-0000-0000-0000-000000000000', '-', '')), NOW());

-- 7. Add foreign key constraints to ChatMessage
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_server_id 
FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_chat_messages_channel_id 
FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE;

-- 8. Create composite indexes for ChatMessage performance optimization
CREATE INDEX idx_chat_messages_server_channel_created_at ON chat_messages(server_id, channel_id, created_at);
CREATE INDEX idx_chat_messages_server_channel_user ON chat_messages(server_id, channel_id, user_id);

-- 9. Create VoiceChannelSettings table for voice-specific channel settings
CREATE TABLE voice_channel_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL UNIQUE,
    voice_effects_enabled BOOLEAN DEFAULT TRUE COMMENT '음성 변조 허용 여부',
    max_voice_users INT DEFAULT 20 COMMENT '동시 음성 참여자 수 제한',
    auto_mute_new_users BOOLEAN DEFAULT FALSE COMMENT '신규 참여자 자동 음소거',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 채널 설정 테이블';

-- 10. Update voice_session_logs to include server_id and channel_id
ALTER TABLE voice_session_logs 
ADD COLUMN server_id BIGINT DEFAULT 1 COMMENT '음성 세션이 발생한 서버 ID',
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '음성 세션이 발생한 채널 ID';

ALTER TABLE voice_session_logs 
ADD CONSTRAINT fk_voice_session_logs_server_id 
FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_voice_session_logs_channel_id 
FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE SET NULL;

-- 11. Update votes table to include server_id and channel_id
ALTER TABLE votes 
ADD COLUMN server_id BIGINT DEFAULT 1 COMMENT '투표가 생성된 서버 ID',
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '투표가 생성된 채널 ID';

ALTER TABLE votes 
ADD CONSTRAINT fk_votes_server_id 
FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_votes_channel_id 
FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE;

-- 12. Update announcements table to include server_id and channel_id
ALTER TABLE announcements 
ADD COLUMN server_id BIGINT DEFAULT 1 COMMENT '공지가 발송된 서버 ID',
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '공지가 발송된 채널 ID';

ALTER TABLE announcements 
ADD CONSTRAINT fk_announcements_server_id 
FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_announcements_channel_id 
FOREIGN KEY (channel_id) REFERENCES server_channels(id) ON DELETE CASCADE;

-- 13. Create performance indexes for new relationships
CREATE INDEX idx_voice_session_logs_server_channel ON voice_session_logs(server_id, channel_id, start_time);
CREATE INDEX idx_votes_server_channel_created_at ON votes(server_id, channel_id, created_at);
CREATE INDEX idx_announcements_server_channel_created_at ON announcements(server_id, channel_id, created_at);

-- 14. Insert default voice channel setting for general channel
INSERT INTO voice_channel_settings (channel_id, voice_effects_enabled, max_voice_users, auto_mute_new_users) 
VALUES (1, TRUE, 20, FALSE);

-- 15. Create server statistics view for monitoring
CREATE VIEW server_statistics AS
SELECT 
    s.id,
    s.name,
    s.description,
    s.created_at,
    COUNT(DISTINCT sm.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN sm.last_activity_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN sm.user_id END) as active_members_24h,
    COUNT(DISTINCT sc.id) as total_channels,
    COUNT(DISTINCT msg.id) as total_messages,
    COUNT(DISTINCT CASE WHEN msg.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN msg.id END) as messages_24h,
    MAX(msg.created_at) as last_message_at
FROM chat_servers s
LEFT JOIN server_members sm ON s.id = sm.server_id AND sm.is_active = TRUE
LEFT JOIN server_channels sc ON s.id = sc.server_id AND sc.is_active = TRUE
LEFT JOIN chat_messages msg ON s.id = msg.server_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.description, s.created_at;

-- 16. Create channel statistics view for monitoring
CREATE VIEW channel_statistics AS
SELECT 
    sc.id,
    sc.server_id,
    s.name as server_name,
    sc.name,
    sc.description,
    sc.channel_type,
    sc.created_at,
    COUNT(DISTINCT cm.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN cm.last_activity_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN cm.user_id END) as active_members_24h,
    COUNT(DISTINCT msg.id) as total_messages,
    COUNT(DISTINCT CASE WHEN msg.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN msg.id END) as messages_24h,
    MAX(msg.created_at) as last_message_at
FROM server_channels sc
LEFT JOIN chat_servers s ON sc.server_id = s.id
LEFT JOIN channel_members cm ON sc.id = cm.channel_id AND cm.is_active = TRUE
LEFT JOIN chat_messages msg ON sc.id = msg.channel_id
WHERE sc.is_active = TRUE AND s.is_active = TRUE
GROUP BY sc.id, sc.server_id, s.name, sc.name, sc.description, sc.channel_type, sc.created_at;

-- 17. Create ServerRole table for custom role management
CREATE TABLE server_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#ffffff' COMMENT '역할 색상 (예: #FF0000)',
    permissions JSON NOT NULL COMMENT '권한 비트맵 또는 키 배열 저장',
    created_by BINARY(16) NOT NULL COMMENT '생성자 User ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_server_role_name (server_id, name),
    INDEX idx_server_roles_server_id (server_id),
    INDEX idx_server_roles_created_by (created_by),
    INDEX idx_server_roles_is_active (is_active),
    
    FOREIGN KEY (server_id) REFERENCES chat_servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='서버별 커스텀 역할 테이블';

-- 18. Extend ServerMember table for custom roles and server-specific profile
ALTER TABLE server_members 
ADD COLUMN display_name VARCHAR(50) COMMENT '서버별 닉네임 (NULL이면 전역 사용자명 사용)',
ADD COLUMN avatar_url VARCHAR(255) COMMENT '서버별 아바타 (NULL이면 전역 아바타 사용)',
ADD COLUMN assigned_roles JSON COMMENT '할당된 ServerRole.id 배열 저장 [1,2,3]';

-- 19. Create default roles for existing servers
INSERT INTO server_roles (server_id, name, color, permissions, created_by, created_at)
VALUES 
(1, 'Admin', '#ff0000', JSON_ARRAY('canManageServer', 'canManageChannels', 'canManageRoles', 'canKickMembers', 'canSendMessages', 'canUseVoice'), UNHEX(REPLACE('00000000-0000-0000-0000-000000000000', '-', '')), NOW()),
(1, 'Member', '#ffffff', JSON_ARRAY('canSendMessages', 'canUseVoice'), UNHEX(REPLACE('00000000-0000-0000-0000-000000000000', '-', '')), NOW());

-- 20. Update existing server members with default roles
UPDATE server_members 
SET assigned_roles = CASE 
    WHEN role = 'ADMIN' THEN JSON_ARRAY(1)  -- Admin role
    WHEN role = 'MEMBER' THEN JSON_ARRAY(2)  -- Member role
    ELSE JSON_ARRAY(2)  -- Default to Member role
END
WHERE assigned_roles IS NULL;

-- Migration completion
-- This migration creates a complete Server-Channel hierarchy with custom roles:
-- 1. Password-protected servers (BCrypt)
-- 2. Role-based channel access (no passwords)
-- 3. Custom server roles with permissions (ServerRole table)
-- 4. Server-specific member profiles (display_name, avatar_url)
-- 5. Channel roles: MEMBER, MODERATOR
-- 6. Performance-optimized indexes
-- 7. Soft delete support
-- 8. Server and channel statistics monitoring