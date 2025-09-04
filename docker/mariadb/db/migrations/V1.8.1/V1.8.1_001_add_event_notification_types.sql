-- =========================================
-- V1.8.1_001: notifications 테이블 type enum에 일정 관련 알림 타입 추가
-- 작성일: 2025-09-04  
-- 목적: 일정 참여 및 확정 관련 알림 타입 지원 (EVENT_JOINED, EVENT_CONFIRMED)
-- =========================================

USE ${DB_DISCORD};

-- 1. 마이그레이션 시작
SELECT 'Adding event notification types...' as status;

-- 2. notifications 테이블의 type enum에 일정 관련 알림 타입 추가
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
    'FRIEND_REQUEST',
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
) NOT NULL COMMENT '알림 타입 (일정 관련 타입 추가)';

-- 3. 변경 사항 확인
SELECT 'Checking notification type enum values...' as status;

-- 4. 테이블 스키마 확인
SHOW CREATE TABLE notifications;

-- 5. 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT 'Added EVENT_JOINED, EVENT_CONFIRMED to notifications.type enum' as changes;