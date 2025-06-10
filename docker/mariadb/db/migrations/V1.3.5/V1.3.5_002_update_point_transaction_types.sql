-- =========================================
-- V1.3.5_002: 포인트 트랜잭션 타입에 광고 관련 항목 추가
-- 작성일: 2025-01-10
-- 목적: 광고 신청 및 환불을 위한 포인트 트랜잭션 타입 확장
-- =========================================

USE ${DB_DISCORD};

-- 1. 변경 시작
SELECT 'Updating point transaction types for advertisement system...' as status;

-- 2. point_histories 테이블의 type 컬럼에 광고 관련 타입 추가
-- 기존 type 컬럼이 VARCHAR(50)이므로 새로운 값들을 추가할 수 있습니다
-- 'ADVERTISEMENT', 'ADVERTISEMENT_REFUND' 값들이 사용될 수 있도록 준비

-- 3. point_histories 테이블의 item_type 컬럼에 THEME_ADVERTISEMENT 추가
-- 기존 item_type 컬럼이 VARCHAR(50)이므로 새로운 값을 추가할 수 있습니다

-- 4. 광고 관련 포인트 기록을 추적하기 위한 인덱스 추가
CREATE INDEX idx_point_histories_ad_type 
ON point_histories(type, item_type);

-- 5. 광고 신청과 포인트 기록을 연결하기 위한 참조 테이블 생성
CREATE TABLE IF NOT EXISTS theme_advertisement_point_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    advertisement_request_id CHAR(36) NOT NULL,
    point_history_id BINARY(16) NOT NULL,
    action_type ENUM('CHARGE', 'REFUND') NOT NULL,
    amount INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ad_point_log_request FOREIGN KEY (advertisement_request_id) 
        REFERENCES theme_advertisement_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_ad_point_log_history FOREIGN KEY (point_history_id) 
        REFERENCES point_histories(id) ON DELETE CASCADE,
    
    INDEX idx_ad_point_log_request (advertisement_request_id),
    INDEX idx_ad_point_log_history (point_history_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='광고 신청과 포인트 기록 연결 로그';

-- 6. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 
    COUNT(DISTINCT type) as transaction_types,
    COUNT(DISTINCT item_type) as item_types
FROM point_histories;