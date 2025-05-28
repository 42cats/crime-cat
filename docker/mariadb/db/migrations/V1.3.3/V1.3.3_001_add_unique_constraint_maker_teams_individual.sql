-- =========================================
-- V1.3.3_001: maker_teams 테이블에 개인 팀 이름 유니크 제약조건 추가
-- 작성일: 2025-05-28
-- 목적: is_individual이 true인 경우 name이 유니크해야 하는 제약조건 추가
-- =========================================

USE ${DB_DISCORD};

-- 1. 중복된 개인 팀 데이터 확인
SELECT 'Checking for duplicate individual team names...' as status;
SELECT name, COUNT(*) as count
FROM maker_teams
WHERE is_individual = true
GROUP BY name
HAVING COUNT(*) > 1;

-- 2. 중복 데이터가 있는 경우 가장 최근 것만 남기고 나머지 삭제
-- (created_at이 없다면 id가 가장 큰 것을 남김)
DELETE t1 FROM maker_teams t1
INNER JOIN maker_teams t2
WHERE t1.name = t2.name
AND t1.is_individual = true
AND t2.is_individual = true
AND t1.id < t2.id;

-- 3. 유니크 인덱스 추가 (is_individual이 true일 때만 name이 유니크)
-- MariaDB는 부분 인덱스를 지원하지 않으므로, 복합 유니크 인덱스 사용
ALTER TABLE maker_teams
ADD UNIQUE INDEX uk_maker_teams_individual_name (name, is_individual);

-- 4. 확인
SELECT 'Unique constraint added successfully' as status;
SELECT COUNT(*) as individual_teams_count
FROM maker_teams
WHERE is_individual = true;