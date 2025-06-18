-- ==============================================================================
-- V1.4.2: Voice Chat 서버 멤버 스키마 수정 및 서버 역할 테이블 추가
-- ==============================================================================
-- 설명: 
--   1. server_members 테이블에 누락된 컬럼 추가 (assigned_roles, display_name, avatar_url)
--   2. server_roles 테이블 생성 (서버별 커스텀 역할 관리)
-- ==============================================================================

USE ${DB_DISCORD};

-- 1. server_members 테이블에 누락된 컬럼 추가
ALTER TABLE server_members 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50) COMMENT '서버별 표시 이름' AFTER role,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) COMMENT '서버별 아바타 URL' AFTER display_name,
ADD COLUMN IF NOT EXISTS assigned_roles JSON COMMENT '할당된 ServerRole.id 목록' AFTER avatar_url;

-- 2. server_roles 테이블 생성 (서버별 커스텀 역할)
CREATE TABLE IF NOT EXISTS server_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    server_id BIGINT NOT NULL COMMENT '서버 ID',
    name VARCHAR(50) NOT NULL COMMENT '역할 이름',
    color VARCHAR(7) DEFAULT '#ffffff' COMMENT '역할 색상 (hex)',
    permissions JSON NOT NULL COMMENT '권한 목록',
    position INT DEFAULT 0 COMMENT '역할 순서 (높을수록 상위)',
    created_by BINARY(16) NOT NULL COMMENT '생성자 UUID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_server_roles_server FOREIGN KEY (server_id) 
        REFERENCES chat_servers(id) ON DELETE CASCADE,
    CONSTRAINT fk_server_roles_creator FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_server_roles_server (server_id, is_active),
    INDEX idx_server_roles_position (server_id, position),
    UNIQUE KEY uk_server_role_name (server_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='서버별 커스텀 역할';

-- 3. 기본 서버 역할 권한 예시 (참고용 주석)
-- permissions JSON 필드 예시:
-- {
--   "manageServer": false,      -- 서버 설정 관리
--   "manageChannels": false,    -- 채널 생성/삭제/수정
--   "manageRoles": false,       -- 역할 관리
--   "manageMembers": false,     -- 멤버 추방/차단
--   "viewChannels": true,       -- 채널 보기
--   "sendMessages": true,       -- 메시지 전송
--   "manageMessages": false,    -- 메시지 삭제/고정
--   "mentionEveryone": false,   -- @everyone 멘션
--   "useVoice": true,          -- 음성 채널 사용
--   "muteMembers": false,       -- 멤버 음소거
--   "deafenMembers": false,     -- 멤버 스피커 음소거
--   "moveMembers": false        -- 멤버 이동
-- }

-- 4. 인덱스 추가 (성능 최적화)
ALTER TABLE server_members
ADD INDEX IF NOT EXISTS idx_server_members_assigned_roles (server_id, assigned_roles(255));

-- 5. 마이그레이션 완료 로그
INSERT INTO schema_version (version, description, type, script, checksum, installed_by, execution_time, success)
VALUES ('1.4.2', 'Fix server_members schema and add server_roles table', 'SQL', 'V1.4.2__fix_server_members_and_add_roles.sql', 
        MD5(CURRENT_TIMESTAMP), 'migration', 0, TRUE);