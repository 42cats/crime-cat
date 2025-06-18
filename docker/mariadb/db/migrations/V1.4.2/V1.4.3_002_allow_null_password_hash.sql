-- ==============================================================================
-- V1.4.3: chat_servers 테이블의 password_hash 컬럼 NULL 허용
-- ==============================================================================
-- 설명: 
--   공개 서버(비밀번호 없음)를 지원하기 위해 password_hash 컬럼을 NULL 허용으로 변경
-- ==============================================================================

USE ${DB_DISCORD};

-- chat_servers 테이블의 password_hash 컬럼을 NULL 허용으로 변경
ALTER TABLE chat_servers 
MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT '서버 비밀번호 해시 (NULL = 공개 서버)';

-- 기존 데이터 확인 및 업데이트 (빈 문자열을 NULL로 변경)
UPDATE chat_servers 
SET password_hash = NULL 
WHERE password_hash = '' OR password_hash = ' ';

-- 인덱스 추가 (공개/비공개 서버 필터링 성능 향상)
ALTER TABLE chat_servers
ADD INDEX IF NOT EXISTS idx_public_servers (password_hash, is_active);

-- 마이그레이션 완료 로그
INSERT INTO schema_version (version, description, type, script, checksum, installed_by, execution_time, success)
VALUES ('1.4.3', 'Allow null password_hash in chat_servers table', 'SQL', 'V1.4.3__allow_null_password_hash.sql', 
        MD5(CURRENT_TIMESTAMP), 'migration', 0, TRUE);