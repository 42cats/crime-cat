-- =========================================
-- V1.3.5_002: 포인트 트랜잭션 타입에 광고 관련 항목 추가
-- 작성일: 2025-01-10
-- 목적: 광고 신청 및 환불을 위한 포인트 트랜잭션 타입 확장
-- =========================================

USE ${DB_WEB};

-- 1. 변경 시작
SELECT 'Updating point transaction types for advertisement system...' as status;

-- 2. point_transactions 테이블의 transaction_type 컬럼 수정
-- 기존 ENUM에 ADVERTISEMENT 추가
ALTER TABLE point_transactions
MODIFY COLUMN transaction_type ENUM(
    'CHARGE',
    'USE',
    'GIFT',
    'RECEIVE',
    'REFUND',
    'EXPIRE',
    'COUPON',
    'DAILY',
    'THEME_REWARD',
    'ADVERTISEMENT',        -- 광고 신청 시 차감
    'ADVERTISEMENT_REFUND'  -- 광고 취소 시 환불
) NOT NULL;

-- 3. point_transactions 테이블의 item_type 컬럼 수정
-- 기존 ENUM에 THEME_ADVERTISEMENT 추가
ALTER TABLE point_transactions
MODIFY COLUMN item_type ENUM(
    'PERMISSION',
    'THEME_WRITING',
    'THEME_ADVERTISEMENT'   -- 테마 광고
) DEFAULT NULL;

-- 4. 광고 관련 포인트 트랜잭션을 추적하기 위한 인덱스 추가
CREATE INDEX idx_point_transactions_ad_type 
ON point_transactions(transaction_type, item_type)
WHERE transaction_type IN ('ADVERTISEMENT', 'ADVERTISEMENT_REFUND');

-- 5. 광고 신청과 포인트 트랜잭션을 연결하기 위한 참조 테이블 생성
CREATE TABLE IF NOT EXISTS theme_advertisement_point_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    advertisement_request_id CHAR(36) NOT NULL,
    point_transaction_id CHAR(36) NOT NULL,
    action_type ENUM('CHARGE', 'REFUND') NOT NULL,
    amount INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ad_point_log_request FOREIGN KEY (advertisement_request_id) 
        REFERENCES theme_advertisement_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_ad_point_log_transaction FOREIGN KEY (point_transaction_id) 
        REFERENCES point_transactions(id) ON DELETE CASCADE,
    
    INDEX idx_ad_point_log_request (advertisement_request_id),
    INDEX idx_ad_point_log_transaction (point_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='광고 신청과 포인트 트랜잭션 연결 로그';

-- 6. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 
    COUNT(DISTINCT transaction_type) as transaction_types,
    COUNT(DISTINCT item_type) as item_types
FROM point_transactions;