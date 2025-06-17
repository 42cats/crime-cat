-- =========================================
-- V1.4.0_001: Voice Chat 시스템을 위한 테이블 생성
-- 작성일: 2025-06-17
-- 목적: Mystery Place Voice Chat 기능 구현을 위한 데이터베이스 스키마 생성
-- =========================================

USE ${DB_DISCORD};

-- 1. 마이그레이션 시작
SELECT 'Creating Voice Chat system tables...' as status;

-- 2. 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID (Discord ID)',
    username VARCHAR(255) NOT NULL COMMENT '사용자명',
    content TEXT NOT NULL COMMENT '메시지 내용',
    message_type ENUM('text', 'gif', 'emoji') DEFAULT 'text' COMMENT '메시지 타입',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅 메시지 테이블';

-- 3. 음성 세션 로그 테이블
CREATE TABLE IF NOT EXISTS voice_session_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID (Discord ID)',
    username VARCHAR(255) NOT NULL COMMENT '사용자명',
    start_time TIMESTAMP NOT NULL COMMENT '세션 시작 시간',
    end_time TIMESTAMP NULL COMMENT '세션 종료 시간',
    effects_used JSON COMMENT '사용된 음성 효과 (JSON 배열)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 세션 로그 테이블';

-- 4. 음성 권한 테이블
CREATE TABLE IF NOT EXISTS voice_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE COMMENT '사용자 ID (Discord ID)',
    can_speak BOOLEAN DEFAULT TRUE COMMENT '발언 권한',
    can_listen BOOLEAN DEFAULT TRUE COMMENT '청취 권한',
    is_admin BOOLEAN DEFAULT FALSE COMMENT '관리자 권한',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 권한 테이블';

-- 5. 투표 테이블
CREATE TABLE IF NOT EXISTS votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL COMMENT '투표 질문',
    options JSON NOT NULL COMMENT '투표 선택지 (JSON 배열)',
    created_by VARCHAR(255) NOT NULL COMMENT '투표 생성자 ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_created_by (created_by),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='투표 테이블';

-- 6. 투표 응답 테이블
CREATE TABLE IF NOT EXISTS vote_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vote_id BIGINT NOT NULL COMMENT '투표 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '응답자 ID',
    username VARCHAR(255) NOT NULL COMMENT '응답자명',
    choice_index INT NOT NULL COMMENT '선택한 옵션 인덱스',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '응답일시',
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote (vote_id, user_id),
    INDEX idx_vote_id (vote_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='투표 응답 테이블';

-- 7. 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL COMMENT '공지 메시지',
    created_by VARCHAR(255) NOT NULL COMMENT '공지 생성자 ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_created_by (created_by),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 테이블';

-- 8. 오디오 파일 테이블
CREATE TABLE IF NOT EXISTS audio_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL COMMENT '저장된 파일명',
    original_filename VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
    duration_seconds INT COMMENT '재생 시간 (초)',
    content_type VARCHAR(100) COMMENT '파일 MIME 타입',
    uploaded_by VARCHAR(255) NOT NULL COMMENT '업로드한 사용자 ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='오디오 파일 테이블';

-- 9. 음성 녹음 파일 테이블
CREATE TABLE IF NOT EXISTS audio_recordings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL COMMENT '녹음한 사용자 ID',
    username VARCHAR(255) NOT NULL COMMENT '녹음한 사용자명',
    file_path VARCHAR(500) NOT NULL COMMENT '녹음 파일 경로',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
    duration_seconds INT COMMENT '녹음 시간 (초)',
    session_id VARCHAR(255) COMMENT '음성 세션 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 녹음 파일 테이블';

-- 10. 변경 사항 확인
SELECT 'Checking created tables...' as status;

SHOW TABLES LIKE 'chat_messages';
SHOW TABLES LIKE 'voice_session_logs';
SHOW TABLES LIKE 'voice_permissions';
SHOW TABLES LIKE 'votes';
SHOW TABLES LIKE 'vote_responses';
SHOW TABLES LIKE 'announcements';
SHOW TABLES LIKE 'audio_files';
SHOW TABLES LIKE 'audio_recordings';

-- 11. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 'Created Voice Chat system tables: chat_messages, voice_session_logs, voice_permissions, votes, vote_responses, announcements, audio_files, audio_recordings' as changes;