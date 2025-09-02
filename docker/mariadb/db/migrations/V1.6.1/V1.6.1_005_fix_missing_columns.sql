-- Migration: V1.6.1_005_fix_missing_columns.sql
-- Description: 누락된 컬럼들을 안전하게 추가 (중복 실행 방지)
-- Created: 2025-08-20 10:00:00

USE ${DB_DISCORD};

-- events 테이블에 event_type 컬럼 추가 (존재하지 않는 경우만)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'event_type' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE events ADD COLUMN event_type VARCHAR(20) NOT NULL DEFAULT ''FIXED''',
    'SELECT ''event_type column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- events 테이블에 min_participants 컬럼 추가
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'min_participants' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE events ADD COLUMN min_participants INT NOT NULL DEFAULT 1',
    'SELECT ''min_participants column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- events 테이블에 start_time 컬럼 추가
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'start_time' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE events ADD COLUMN start_time DATETIME NULL',
    'SELECT ''start_time column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- events 테이블에 end_time 컬럼 추가
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'end_time' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE events ADD COLUMN end_time DATETIME NULL',
    'SELECT ''end_time column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- events 테이블에 confirmed_at 컬럼 추가
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'events' 
     AND COLUMN_NAME = 'confirmed_at' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE events ADD COLUMN confirmed_at DATETIME NULL',
    'SELECT ''confirmed_at column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- event_participants 테이블에 left_at 컬럼 추가
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'event_participants' 
     AND COLUMN_NAME = 'left_at' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE event_participants ADD COLUMN left_at DATETIME NULL COMMENT ''일정에서 나간 시점 (NULL이면 참여중)''',
    'SELECT ''left_at column already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 성능 최적화를 위한 인덱스 추가 (존재하지 않는 경우만)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_NAME = 'event_participants' 
     AND INDEX_NAME = 'idx_event_participants_left_at' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE event_participants ADD INDEX idx_event_participants_left_at (left_at)',
    'SELECT ''idx_event_participants_left_at index already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_NAME = 'event_participants' 
     AND INDEX_NAME = 'idx_event_participants_active' 
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE event_participants ADD INDEX idx_event_participants_active (event_id, left_at)',
    'SELECT ''idx_event_participants_active index already exists'' AS info'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 마이그레이션 완료 로그
SELECT 'V1.6.1_005_fix_missing_columns migration completed successfully' AS result;