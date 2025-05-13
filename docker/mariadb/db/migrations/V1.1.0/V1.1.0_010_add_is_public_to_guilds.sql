-- Migration: V1.1.0_010_add_is_public_to_guilds.sql
-- Description: guilds 테이블에 is_public 컬럼 추가 (기본값 false)
-- Created: 2025-05-13 12:00:00

USE ${DB_DISCORD};

START TRANSACTION;

-- 컬럼 존재 여부 확인
SET @columnExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'guilds' 
      AND COLUMN_NAME = 'is_public'
);

-- 컬럼이 존재하지 않을 경우에만 추가
SET @addColumnSQL = IF(@columnExists = 0,
    'ALTER TABLE guilds ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''공개 여부 (기본값: 비공개)''',
    'SELECT ''is_public column already exists'''
);

-- 준비 및 실행
PREPARE stmt FROM @addColumnSQL;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
