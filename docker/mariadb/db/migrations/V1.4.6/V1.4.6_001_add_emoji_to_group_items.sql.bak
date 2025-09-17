-- V1.4.6_001: group_items 테이블에 이모지 컬럼 추가
-- 작성일: 2025-07-06
-- 설명: group_items 테이블에 이모지를 저장할 emoji 컬럼을 추가합니다.

ALTER TABLE `group_items` 
ADD COLUMN `emoji` varchar(100) DEFAULT NULL COMMENT 'Emoji for button/content display (Unicode or Discord custom emoji format)' 
AFTER `role_id`;

-- 인덱스 추가 (이모지로 검색할 경우를 대비)
CREATE INDEX `idx_group_items_emoji` ON `group_items` (`emoji`);

-- 컬럼 추가 확인
DESCRIBE `group_items`;