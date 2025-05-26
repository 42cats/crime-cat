-- game_themes 테이블의 author 참조를 users에서 web_users로 변경

-- 1. 기존 외래키 제약조건 삭제
ALTER TABLE `game_themes` DROP FOREIGN KEY `fk_author`;

-- 2. 새로운 외래키 제약조건 추가 (web_users 테이블 참조)
ALTER TABLE `game_themes` 
ADD CONSTRAINT `fk_game_themes_author` 
FOREIGN KEY (`author`) REFERENCES `web_users` (`id`) ON DELETE CASCADE;

-- 3. 인덱스 이름 업데이트 (선택사항)
ALTER TABLE `game_themes` DROP INDEX `fk_author`;
ALTER TABLE `game_themes` ADD INDEX `idx_game_themes_author` (`author`);

-- 4. 컬럼 코멘트 업데이트
ALTER TABLE `game_themes` 
MODIFY COLUMN `author` binary(16) NOT NULL COMMENT '작성자 (web_users.id 참조)';

SELECT 'Game themes author reference updated to web_users table' as result;