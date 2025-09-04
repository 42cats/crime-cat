-- =========================================
-- V1.8.2_001: Java enum과 DB enum 동기화 (FRIEND_REQUEST 제거)
-- 작성일: 2025-09-04  
-- 목적: Java NotificationType enum과 DB notifications.type enum 완전 동기화
-- 문제: DB에 FRIEND_REQUEST가 있지만 Java enum에는 없어서 JPA 파라미터 바인딩 실패
-- =========================================

USE ${DB_DISCORD};

-- 1. 마이그레이션 시작
SELECT 'Syncing notification types with Java enum...' as status;

-- 2. FRIEND_REQUEST 타입을 사용하는 기존 데이터가 있는지 확인
SELECT 'Checking existing FRIEND_REQUEST notifications...' as status;
SELECT COUNT(*) as friend_request_count 
FROM notifications 
WHERE type = 'FRIEND_REQUEST';

-- 3. FRIEND_REQUEST 데이터가 있다면 SYSTEM_NOTICE로 변환
UPDATE notifications 
SET type = 'SYSTEM_NOTICE', 
    message = CONCAT('[시스템 변환] ', message)
WHERE type = 'FRIEND_REQUEST';

-- 4. notifications 테이블의 type enum을 Java enum과 동일하게 수정 (FRIEND_REQUEST 제거)
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
    'GAME_NOTICE',
    'COMMENT_ALERT',
    'SYSTEM_NOTICE',
    'NEW_THEME',
    'GAME_RECORD_REQUEST',
    'USER_POST_NEW',
    'USER_POST_COMMENT',
    'USER_POST_COMMENT_REPLY',
    'THEME_POINT_REWARD',
    'THEME_AD_EXPIRED',
    'THEME_AD_ACTIVATED',
    'THEME_AD_CANCELLED',
    'EVENT_JOINED',
    'EVENT_CONFIRMED'
) NOT NULL COMMENT '알림 타입 (Java enum과 동기화 - FRIEND_REQUEST 제거)';

-- 5. 변경 사항 확인
SELECT 'Checking updated notification type enum values...' as status;

-- 6. 테이블 스키마 확인
SHOW CREATE TABLE notifications;

-- 7. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 'Removed FRIEND_REQUEST, synced with Java enum (14 values)' as changes;
SELECT 'Java enum count matches DB enum count now' as result;