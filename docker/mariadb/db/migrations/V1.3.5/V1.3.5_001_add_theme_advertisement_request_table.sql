-- =========================================
-- V1.3.5_001: theme_advertisement_requests 테이블 생성
-- 작성일: 2025-01-10
-- 목적: 사용자가 포인트를 사용해 광고를 신청할 수 있는 시스템 구현
-- =========================================

USE ${DB_WEB};

-- 1. 테이블 생성 시작
SELECT 'Creating theme_advertisement_requests table...' as status;

-- 2. theme_advertisement_requests 테이블 생성
CREATE TABLE IF NOT EXISTS theme_advertisement_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    theme_id CHAR(36) NOT NULL,
    theme_type ENUM('CRIMESCENE', 'ESCAPE_ROOM', 'MURDER_MYSTERY', 'REALWORLD') NOT NULL,
    theme_name VARCHAR(255) NOT NULL,
    requested_days INT NOT NULL COMMENT '신청 일수',
    remaining_days INT DEFAULT NULL COMMENT '남은 일수',
    total_cost INT NOT NULL COMMENT '총 비용 (일수 × 100포인트)',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청 일시',
    started_at TIMESTAMP NULL DEFAULT NULL COMMENT '광고 시작 일시',
    expires_at TIMESTAMP NULL DEFAULT NULL COMMENT '광고 만료 예정 일시',
    status ENUM('PENDING_QUEUE', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING_QUEUE',
    queue_position INT DEFAULT NULL COMMENT '대기열 순번',
    click_count INT NOT NULL DEFAULT 0 COMMENT '클릭 수',
    exposure_count INT NOT NULL DEFAULT 0 COMMENT '노출 수',
    cancelled_at TIMESTAMP NULL DEFAULT NULL COMMENT '취소 일시',
    refund_amount INT DEFAULT NULL COMMENT '환불 금액',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_theme_ad_request_user FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE,
    INDEX idx_theme_ad_request_user_id (user_id),
    INDEX idx_theme_ad_request_theme_id (theme_id),
    INDEX idx_theme_ad_request_status (status),
    INDEX idx_theme_ad_request_queue_position (queue_position),
    INDEX idx_theme_ad_request_expires_at (expires_at),
    INDEX idx_theme_ad_request_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테마 광고 신청 및 큐 관리 테이블';

-- 3. 트리거 생성: 큐 포지션 자동 설정
DELIMITER $$

CREATE TRIGGER before_insert_theme_ad_request
BEFORE INSERT ON theme_advertisement_requests
FOR EACH ROW
BEGIN
    -- 대기열 상태로 들어가는 경우 큐 포지션 설정
    IF NEW.status = 'PENDING_QUEUE' THEN
        SET NEW.queue_position = (
            SELECT COALESCE(MAX(queue_position), 0) + 1
            FROM theme_advertisement_requests
            WHERE status = 'PENDING_QUEUE'
        );
    END IF;
END$$

DELIMITER ;

-- 4. 프로시저 생성: 큐 포지션 재정렬
DELIMITER $$

CREATE PROCEDURE reorder_ad_queue()
BEGIN
    SET @position = 0;
    
    UPDATE theme_advertisement_requests
    SET queue_position = (@position := @position + 1)
    WHERE status = 'PENDING_QUEUE'
    ORDER BY requested_at ASC;
END$$

DELIMITER ;

-- 5. 프로시저 생성: 대기열에서 활성화
DELIMITER $$

CREATE PROCEDURE activate_next_ad_from_queue()
BEGIN
    DECLARE next_ad_id CHAR(36);
    DECLARE active_count INT;
    
    -- 현재 활성 광고 수 확인
    SELECT COUNT(*) INTO active_count
    FROM theme_advertisement_requests
    WHERE status = 'ACTIVE';
    
    -- 활성 광고가 15개 미만이면 대기열에서 다음 광고 활성화
    IF active_count < 15 THEN
        -- 대기열에서 가장 앞의 광고 찾기
        SELECT id INTO next_ad_id
        FROM theme_advertisement_requests
        WHERE status = 'PENDING_QUEUE'
        ORDER BY queue_position ASC
        LIMIT 1;
        
        -- 찾은 광고를 활성화
        IF next_ad_id IS NOT NULL THEN
            UPDATE theme_advertisement_requests
            SET status = 'ACTIVE',
                started_at = NOW(),
                expires_at = DATE_ADD(NOW(), INTERVAL requested_days DAY),
                remaining_days = requested_days,
                queue_position = NULL
            WHERE id = next_ad_id;
            
            -- 큐 재정렬
            CALL reorder_ad_queue();
        END IF;
    END IF;
END$$

DELIMITER ;

-- 6. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_ads,
    COUNT(CASE WHEN status = 'PENDING_QUEUE' THEN 1 END) as queued_ads
FROM theme_advertisement_requests;