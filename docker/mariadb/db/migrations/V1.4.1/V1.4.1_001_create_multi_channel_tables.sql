-- V1.4.1_001: Multi-Channel Support for Voice Chat System
-- Create ChatChannel and ChannelMember tables, modify ChatMessage for channel support

-- 1. Create ChatChannel table with password protection support
CREATE TABLE chat_channels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '채널명 (중복 불가)',
    description VARCHAR(500) COMMENT '채널 설명',
    password_hash VARCHAR(255) COMMENT 'BCrypt 해시 (null이면 공개 채널)',
    created_by BINARY(16) NOT NULL COMMENT '채널 생성자 User ID',
    max_members INT DEFAULT 100 COMMENT '최대 참여자 수',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete 시간',
    
    INDEX idx_chat_channels_created_by (created_by),
    INDEX idx_chat_channels_is_active (is_active),
    INDEX idx_chat_channels_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 채널 테이블';

-- 2. Create ChannelMember table for participation tracking
CREATE TABLE channel_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL,
    user_id BINARY(16) NOT NULL,
    role ENUM('OWNER', 'ADMIN', 'MEMBER') DEFAULT 'MEMBER' COMMENT '채널 내 역할',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Soft delete 플래그',
    
    UNIQUE KEY unique_channel_user (channel_id, user_id),
    INDEX idx_channel_members_user_id (user_id),
    INDEX idx_channel_members_channel_id (channel_id),
    INDEX idx_channel_members_last_activity (last_activity_at),
    INDEX idx_channel_members_is_active (is_active),
    
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채널 참여자 테이블';

-- 3. Add channel_id to existing ChatMessage table
ALTER TABLE chat_messages 
ADD COLUMN channel_id BIGINT NOT NULL DEFAULT 1 COMMENT '채널 ID (기본값 1은 기본 채널)';

-- 4. Create default channel
INSERT INTO chat_channels (id, name, description, created_by, is_active, created_at) 
VALUES (1, 'General', '기본 채널입니다', UNHEX(REPLACE('00000000-0000-0000-0000-000000000000', '-', '')), TRUE, NOW());

-- 5. Add foreign key constraint to ChatMessage after default channel creation
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_channel_id 
FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE;

-- 6. Create composite indexes for ChatMessage performance optimization
CREATE INDEX idx_chat_messages_channel_created_at ON chat_messages(channel_id, created_at);
CREATE INDEX idx_chat_messages_channel_user ON chat_messages(channel_id, user_id);

-- 7. Create VoiceChannel table for voice-specific channel settings
CREATE TABLE voice_channels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    channel_id BIGINT NOT NULL UNIQUE,
    voice_effects_enabled BOOLEAN DEFAULT TRUE COMMENT '음성 변조 허용 여부',
    max_voice_users INT DEFAULT 20 COMMENT '동시 음성 참여자 수 제한',
    auto_mute_new_users BOOLEAN DEFAULT FALSE COMMENT '신규 참여자 자동 음소거',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 채널 설정 테이블';

-- 8. Add channel_id to voice_session_logs for channel-specific voice tracking
ALTER TABLE voice_session_logs 
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '음성 세션이 발생한 채널 ID';

ALTER TABLE voice_session_logs 
ADD CONSTRAINT fk_voice_session_logs_channel_id 
FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE SET NULL;

-- 9. Create index for voice session logs performance
CREATE INDEX idx_voice_session_logs_channel_user ON voice_session_logs(channel_id, user_id);
CREATE INDEX idx_voice_session_logs_channel_start_time ON voice_session_logs(channel_id, start_time);

-- 10. Add channel_id to votes table for channel-specific voting
ALTER TABLE votes 
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '투표가 생성된 채널 ID';

ALTER TABLE votes 
ADD CONSTRAINT fk_votes_channel_id 
FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE;

-- 11. Add channel_id to announcements table for channel-specific announcements
ALTER TABLE announcements 
ADD COLUMN channel_id BIGINT DEFAULT 1 COMMENT '공지가 발송된 채널 ID';

ALTER TABLE announcements 
ADD CONSTRAINT fk_announcements_channel_id 
FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE;

-- 12. Create indexes for votes and announcements
CREATE INDEX idx_votes_channel_created_at ON votes(channel_id, created_at);
CREATE INDEX idx_announcements_channel_created_at ON announcements(channel_id, created_at);

-- 13. Insert default voice channel setting for General channel
INSERT INTO voice_channels (channel_id, voice_effects_enabled, max_voice_users, auto_mute_new_users) 
VALUES (1, TRUE, 20, FALSE);

-- 14. Create channel statistics view for monitoring
CREATE VIEW channel_statistics AS
SELECT 
    c.id,
    c.name,
    c.description,
    c.created_at,
    COUNT(DISTINCT cm.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN cm.last_activity_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN cm.user_id END) as active_members_24h,
    COUNT(DISTINCT msg.id) as total_messages,
    COUNT(DISTINCT CASE WHEN msg.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN msg.id END) as messages_24h,
    MAX(msg.created_at) as last_message_at
FROM chat_channels c
LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.is_active = TRUE
LEFT JOIN chat_messages msg ON c.id = msg.channel_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.description, c.created_at;

-- Migration completion
-- This migration adds complete multi-channel support with:
-- 1. Password-protected channels
-- 2. Member management with roles
-- 3. Channel-specific voice settings
-- 4. Performance-optimized indexes
-- 5. Soft delete support
-- 6. Channel statistics monitoring