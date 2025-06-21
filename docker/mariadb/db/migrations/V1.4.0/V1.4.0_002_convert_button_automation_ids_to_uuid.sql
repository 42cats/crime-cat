-- V1.4.0_002_convert_button_automation_ids_to_uuid.sql
-- ButtonAutomation 시스템의 ID 필드를 VARCHAR에서 UUID(BINARY(16))로 변환

-- Step 1: 새로운 UUID 컬럼 추가
ALTER TABLE button_automation_groups 
ADD COLUMN new_id BINARY(16) DEFAULT NULL;

ALTER TABLE button_automations 
ADD COLUMN new_id BINARY(16) DEFAULT NULL,
ADD COLUMN new_group_id BINARY(16) DEFAULT NULL;

-- Step 2: 기존 데이터를 UUID로 변환하여 채우기
-- 그룹 테이블의 UUID 생성
UPDATE button_automation_groups 
SET new_id = UNHEX(REPLACE(UUID(), '-', ''));

-- 버튼 테이블의 UUID 생성 및 외래키 매핑
UPDATE button_automations ba
SET ba.new_id = UNHEX(REPLACE(UUID(), '-', ''));

-- 그룹 ID 매핑 (기존 VARCHAR group_id를 새로운 UUID로 매핑)
UPDATE button_automations ba
INNER JOIN button_automation_groups bag ON ba.group_id = bag.id
SET ba.new_group_id = bag.new_id
WHERE ba.group_id IS NOT NULL;

-- Step 3: 기존 컬럼 삭제 및 새 컬럼을 기본 컬럼으로 변경
-- 외래키 제약조건이 있다면 먼저 삭제
-- ALTER TABLE button_automations DROP FOREIGN KEY IF EXISTS fk_button_automation_group;

-- 기존 컬럼 삭제
ALTER TABLE button_automation_groups 
DROP COLUMN id;

ALTER TABLE button_automations 
DROP COLUMN id,
DROP COLUMN group_id;

-- 새 컬럼을 기본 컬럼으로 이름 변경
ALTER TABLE button_automation_groups 
CHANGE COLUMN new_id id BINARY(16) NOT NULL PRIMARY KEY;

ALTER TABLE button_automations 
CHANGE COLUMN new_id id BINARY(16) NOT NULL PRIMARY KEY,
CHANGE COLUMN new_group_id group_id BINARY(16) DEFAULT NULL;

-- Step 4: 인덱스 재생성
CREATE INDEX idx_button_automations_guild_id ON button_automations(guild_id);
CREATE INDEX idx_button_automations_group_id ON button_automations(group_id);
CREATE INDEX idx_button_automation_groups_guild_id ON button_automation_groups(guild_id);

-- Step 5: 외래키 제약조건 재생성 (선택사항)
-- ALTER TABLE button_automations 
-- ADD CONSTRAINT fk_button_automation_group 
-- FOREIGN KEY (group_id) REFERENCES button_automation_groups(id) ON DELETE CASCADE;

-- 변환 완료 로그
SELECT 'Button Automation UUID migration completed' as status;