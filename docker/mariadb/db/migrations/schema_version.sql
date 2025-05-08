-- 데이터베이스 선택
USE ${DB_DISCORD};

-- 스키마 버전 관리 테이블 생성
CREATE TABLE IF NOT EXISTS schema_version (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL
);

-- 초기 버전 기록 (기존 스키마를 V1.0.0으로 간주)
INSERT INTO schema_version 
(version, description, type, script, checksum, installed_by, execution_time, success)
VALUES 
('1.0.0', 'initial schema', 'SQL', 'V1.0.0_init.sql', 'initial', 'system', 0, 1);
