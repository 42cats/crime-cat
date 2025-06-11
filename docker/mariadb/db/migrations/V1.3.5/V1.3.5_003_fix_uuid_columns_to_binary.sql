-- =========================================
-- V1.3.5_003: UUID 컬럼을 BINARY(16)으로 수정
-- 작성일: 2025-06-11
-- 목적: theme_advertisement_requests 테이블의 UUID 컬럼을 CHAR(36)에서 BINARY(16)으로 변경하여 
--       JPA 엔티티 정의와 일치시키고 저장 공간 효율성 및 성능 향상
-- =========================================

USE ${DB_DISCORD};

-- 1. 변경 시작
SELECT 'Converting UUID columns from CHAR(36) to BINARY(16)...' as status;

-- 2. 기존 데이터 백업 확인
SELECT COUNT(*) as existing_records_count 
FROM theme_advertisement_requests;

-- 3. 외래키 제약 조건 확인 및 임시 제거
SELECT 'Temporarily removing foreign key constraints...' as status;

-- theme_advertisement_point_logs 테이블의 외래키 제약 조건 확인
SET foreign_key_checks = 0;

-- 4. 컬럼 타입 변경 - id 컬럼 (CHAR(36) -> BINARY(16))
SELECT 'Converting id column from CHAR(36) to BINARY(16)...' as status;

-- 기존 CHAR(36) UUID를 BINARY(16)으로 변환하는 임시 컬럼 추가
ALTER TABLE theme_advertisement_requests 
ADD COLUMN id_new BINARY(16);

-- 기존 UUID 문자열을 BINARY(16)으로 변환하여 복사
UPDATE theme_advertisement_requests 
SET id_new = UNHEX(REPLACE(id, '-', ''));

-- Primary Key 제약조건 제거
ALTER TABLE theme_advertisement_requests 
DROP PRIMARY KEY;

-- 기존 id 컬럼 제거
ALTER TABLE theme_advertisement_requests 
DROP COLUMN id;

-- 새 컬럼을 id로 이름 변경
ALTER TABLE theme_advertisement_requests 
CHANGE COLUMN id_new id BINARY(16) NOT NULL;

-- Primary Key 다시 설정
ALTER TABLE theme_advertisement_requests 
ADD PRIMARY KEY (id);

-- 5. 컬럼 타입 변경 - theme_id 컬럼 (CHAR(36) -> BINARY(16))
SELECT 'Converting theme_id column from CHAR(36) to BINARY(16)...' as status;

-- 기존 CHAR(36) UUID를 BINARY(16)으로 변환하는 임시 컬럼 추가
ALTER TABLE theme_advertisement_requests 
ADD COLUMN theme_id_new BINARY(16);

-- 기존 UUID 문자열을 BINARY(16)으로 변환하여 복사
UPDATE theme_advertisement_requests 
SET theme_id_new = UNHEX(REPLACE(theme_id, '-', ''));

-- 기존 theme_id 컬럼의 인덱스 제거
DROP INDEX idx_theme_ad_request_theme_id ON theme_advertisement_requests;

-- 기존 theme_id 컬럼 제거
ALTER TABLE theme_advertisement_requests 
DROP COLUMN theme_id;

-- 새 컬럼을 theme_id로 이름 변경
ALTER TABLE theme_advertisement_requests 
CHANGE COLUMN theme_id_new theme_id BINARY(16) NOT NULL;

-- theme_id 인덱스 다시 생성
CREATE INDEX idx_theme_ad_request_theme_id ON theme_advertisement_requests(theme_id);

-- 6. theme_advertisement_point_logs 테이블의 UUID 컬럼들 수정
SELECT 'Updating theme_advertisement_point_logs UUID columns...' as status;

-- 6-1. id 컬럼을 BINARY(16)으로 변경
ALTER TABLE theme_advertisement_point_logs 
ADD COLUMN id_new BINARY(16);

-- 기존 UUID 문자열을 BINARY(16)으로 변환하여 복사
UPDATE theme_advertisement_point_logs 
SET id_new = UNHEX(REPLACE(id, '-', ''));

-- Primary Key 제약조건 제거
ALTER TABLE theme_advertisement_point_logs 
DROP PRIMARY KEY;

-- 기존 id 컬럼 제거
ALTER TABLE theme_advertisement_point_logs 
DROP COLUMN id;

-- 새 컬럼을 id로 이름 변경
ALTER TABLE theme_advertisement_point_logs 
CHANGE COLUMN id_new id BINARY(16) NOT NULL;

-- Primary Key 다시 설정
ALTER TABLE theme_advertisement_point_logs 
ADD PRIMARY KEY (id);

-- 6-2. advertisement_request_id 컬럼을 BINARY(16)으로 변경
ALTER TABLE theme_advertisement_point_logs 
ADD COLUMN advertisement_request_id_new BINARY(16);

-- 기존 UUID 문자열을 BINARY(16)으로 변환하여 복사
UPDATE theme_advertisement_point_logs 
SET advertisement_request_id_new = UNHEX(REPLACE(advertisement_request_id, '-', ''));

-- 외래키 제약 조건 제거
ALTER TABLE theme_advertisement_point_logs 
DROP FOREIGN KEY fk_ad_point_log_request;

-- 기존 인덱스 제거
DROP INDEX idx_ad_point_log_request ON theme_advertisement_point_logs;

-- 기존 컬럼 제거
ALTER TABLE theme_advertisement_point_logs 
DROP COLUMN advertisement_request_id;

-- 새 컬럼을 advertisement_request_id로 이름 변경
ALTER TABLE theme_advertisement_point_logs 
CHANGE COLUMN advertisement_request_id_new advertisement_request_id BINARY(16) NOT NULL;

-- 인덱스 다시 생성
CREATE INDEX idx_ad_point_log_request ON theme_advertisement_point_logs(advertisement_request_id);

-- 외래키 제약 조건 다시 생성
ALTER TABLE theme_advertisement_point_logs 
ADD CONSTRAINT fk_ad_point_log_request 
FOREIGN KEY (advertisement_request_id) REFERENCES theme_advertisement_requests(id) ON DELETE CASCADE;

-- 7. 외래키 체크 다시 활성화
SET foreign_key_checks = 1;

-- 8. 프로시저 수정: activate_next_ad_from_queue에서 CHAR(36) 변수를 BINARY(16)으로 변경
SELECT 'Updating stored procedures for BINARY(16) UUID...' as status;

DROP PROCEDURE IF EXISTS activate_next_ad_from_queue;

DELIMITER $$

CREATE PROCEDURE activate_next_ad_from_queue()
BEGIN
    DECLARE next_ad_id BINARY(16);
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

-- 9. 변환 결과 확인
SELECT 'Migration completed successfully' as status;

-- 변환된 데이터 검증
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN LENGTH(id) = 16 THEN 1 END) as binary_id_count,
    COUNT(CASE WHEN LENGTH(theme_id) = 16 THEN 1 END) as binary_theme_id_count
FROM theme_advertisement_requests;

-- theme_advertisement_point_logs 테이블도 확인
SELECT 
    COUNT(*) as point_log_records,
    COUNT(CASE WHEN LENGTH(id) = 16 THEN 1 END) as binary_id_count,
    COUNT(CASE WHEN LENGTH(advertisement_request_id) = 16 THEN 1 END) as binary_ad_request_id_count
FROM theme_advertisement_point_logs;

SELECT 'UUID columns successfully converted to BINARY(16)' as status;