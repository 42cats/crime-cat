-- =========================================
-- V1.4.5_001: 버튼 자동화 시스템 유니크 제약 조건 변경
-- 작성일: 2025-07-05
-- 목적: 버튼명의 유니크 제약을 그룹 내에서만 적용되도록 변경
-- 변경사항: uk_guild_label (guild_id, button_label) → uk_group_label (group_id, button_label)
-- =========================================

USE ${DB_DISCORD};

-- 마이그레이션 시작 로그
SELECT 'Starting Button Automation Unique Constraint Update Migration...' as status;

-- 1. 기존 제약 조건 확인
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'button_automations' 
  AND CONSTRAINT_NAME = 'uk_guild_label';

-- 2. 기존 데이터에서 중복 확인 (그룹 내 중복 체크)
SELECT 
    'Checking for potential conflicts within groups...' as status;

SELECT 
    group_id,
    button_label,
    COUNT(*) as duplicate_count
FROM button_automations 
WHERE group_id IS NOT NULL
GROUP BY group_id, button_label
HAVING COUNT(*) > 1;

-- 3. NULL group_id를 가진 버튼들 확인
SELECT 
    'Checking buttons without group assignment...' as status;

SELECT 
    COUNT(*) as buttons_without_group,
    GROUP_CONCAT(DISTINCT button_label ORDER BY button_label) as button_labels
FROM button_automations 
WHERE group_id IS NULL;

-- 4. 기존 유니크 제약 조건 삭제
SELECT 'Dropping existing unique constraint uk_guild_label...' as status;

ALTER TABLE button_automations 
DROP INDEX uk_guild_label;

-- 5. 새로운 유니크 제약 조건 추가 (그룹 내에서만 유니크)
SELECT 'Adding new unique constraint uk_group_label...' as status;

-- group_id가 NULL이 아닌 경우에만 유니크 제약 적용
-- NULL group_id를 가진 버튼들은 별도로 처리하지 않음 (orphaned buttons)
ALTER TABLE button_automations 
ADD CONSTRAINT uk_group_label UNIQUE (group_id, button_label);

-- 6. 길드 레벨에서의 중복 허용을 위한 인덱스 추가 (성능 최적화)
SELECT 'Adding performance index for guild-level queries...' as status;

-- 길드별 버튼 조회 성능을 위한 인덱스 (유니크하지 않음)
CREATE INDEX idx_guild_button_label ON button_automations(guild_id, button_label);

-- 7. 변경 사항 확인
SELECT 'Verifying constraint changes...' as status;

-- 새로운 제약 조건 확인
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    TABLE_NAME,
    ORDINAL_POSITION
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'button_automations' 
  AND CONSTRAINT_NAME = 'uk_group_label'
ORDER BY ORDINAL_POSITION;

-- 인덱스 확인
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'button_automations'
  AND INDEX_NAME IN ('uk_group_label', 'idx_guild_button_label')
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 8. 테스트 데이터로 변경 사항 검증
SELECT 'Testing new constraint behavior...' as status;

-- 같은 길드 내 다른 그룹에서 동일한 버튼명이 가능한지 확인
SELECT 
    '이제 같은 길드 내 다른 그룹에서 동일한 버튼명을 사용할 수 있습니다.' as new_behavior,
    '그룹 내에서는 여전히 버튼명이 유니크해야 합니다.' as constraint_rule;

-- 9. 마이그레이션 완료 로그
SELECT 'Button Automation Unique Constraint Update completed successfully!' as status;
SELECT CONCAT(
    'Migration V1.4.5_001 완료. ',
    '버튼명 유니크 제약이 그룹 내로 제한되었습니다. ',
    '이제 서로 다른 그룹에서 동일한 버튼명을 사용할 수 있습니다.'
) as result;

-- 10. 주의사항 및 다음 단계
SELECT '
주의사항:
1. 기존 애플리케이션 코드에서 버튼명 중복 검증 로직을 수정해야 합니다.
2. Repository의 existsByGuildIdAndButtonLabel 메서드를 수정하거나 새로운 메서드 추가가 필요합니다.
3. 그룹이 삭제될 때 해당 그룹의 버튼들도 함께 삭제됩니다 (ON DELETE CASCADE).

다음 단계:
- ButtonAutomationRepository에 existsByGroupIdAndButtonLabel 메서드 추가
- ButtonAutomationService의 복사 로직 업데이트
- 프론트엔드 유효성 검사 로직 업데이트
' as next_steps;