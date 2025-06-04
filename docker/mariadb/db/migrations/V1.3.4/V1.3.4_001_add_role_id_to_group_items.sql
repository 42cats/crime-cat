-- =========================================
-- V1.3.4_001: group_items 테이블에 role_id 컬럼 추가
-- 작성일: 2025-01-04
-- 목적: 메시지 매크로에 역할 기반 권한 검사 기능 추가
-- =========================================

USE ${DB_DISCORD};

-- 1. 컬럼 추가 전 상태 확인
SELECT 'Adding role_id column to group_items table...' as status;

-- 2. role_id 컬럼 추가 (NULL 허용)
ALTER TABLE group_items
ADD COLUMN role_id VARCHAR(255) DEFAULT NULL
COMMENT 'Discord role ID for permission check';

-- 3. 인덱스 추가 (검색 성능 향상)
CREATE INDEX idx_group_items_role_id ON group_items(role_id);

-- 4. 추가 확인
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_items, 
       COUNT(role_id) as items_with_role 
FROM group_items;