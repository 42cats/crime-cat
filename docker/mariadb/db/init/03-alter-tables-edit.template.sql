USE ${DB_DISCORD};

-- 안전하게 FK 및 인덱스 처리

-- 1. 테이블과 FK 존재 여부 확인 후 조치
SET @musics_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                          WHERE table_schema = '${DB_DISCORD}' AND table_name = 'musics');

SET @observations_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                              WHERE table_schema = '${DB_DISCORD}' AND table_name = 'observations');

SET @password_note_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                               WHERE table_schema = '${DB_DISCORD}' AND table_name = 'password_note');

SET @records_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                         WHERE table_schema = '${DB_DISCORD}' AND table_name = 'records');

SET @user_permissions_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                                  WHERE table_schema = '${DB_DISCORD}' AND table_name = 'user_permissions');

-- 테이블이 존재하는 경우에만 FK 삭제 시도
SET @drop_musics_fk = IF(@musics_table_exists > 0, 'ALTER TABLE musics DROP FOREIGN KEY IF EXISTS fk_musics_guilds', 'DO 0');
PREPARE stmt1 FROM @drop_musics_fk;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @drop_observations_fk = IF(@observations_table_exists > 0, 'ALTER TABLE observations DROP FOREIGN KEY IF EXISTS fk_observations_guilds', 'DO 0');
PREPARE stmt2 FROM @drop_observations_fk;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET @drop_password_note_fk = IF(@password_note_table_exists > 0, 'ALTER TABLE password_note DROP FOREIGN KEY IF EXISTS fk_password_note_guild', 'DO 0');
PREPARE stmt3 FROM @drop_password_note_fk;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

SET @drop_records_fk = IF(@records_table_exists > 0, 'ALTER TABLE records DROP FOREIGN KEY IF EXISTS fk_records_guilds', 'DO 0');
PREPARE stmt4 FROM @drop_records_fk;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

SET @drop_user_permissions_fk = IF(@user_permissions_table_exists > 0, 'ALTER TABLE user_permissions DROP FOREIGN KEY IF EXISTS fk_user_permissions_discord_users', 'DO 0');
PREPARE stmt5 FROM @drop_user_permissions_fk;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- 2. 테이블이 존재하는 경우에만 컬럼 수정 시도
SET @modify_musics = IF(@musics_table_exists > 0, 'ALTER TABLE musics MODIFY guild_snowflake VARCHAR(50) NOT NULL', 'DO 0');
PREPARE stmt6 FROM @modify_musics;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

SET @modify_observations = IF(@observations_table_exists > 0, 'ALTER TABLE observations MODIFY guild_snowflake VARCHAR(50) NOT NULL', 'DO 0');
PREPARE stmt7 FROM @modify_observations;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

SET @modify_password_note = IF(@password_note_table_exists > 0, 'ALTER TABLE password_note MODIFY guild_snowflake VARCHAR(50) NOT NULL', 'DO 0');
PREPARE stmt8 FROM @modify_password_note;
EXECUTE stmt8;
DEALLOCATE PREPARE stmt8;

SET @modify_records = IF(@records_table_exists > 0, 'ALTER TABLE records MODIFY guild_snowflake VARCHAR(50) NOT NULL', 'DO 0');
PREPARE stmt9 FROM @modify_records;
EXECUTE stmt9;
DEALLOCATE PREPARE stmt9;

SET @modify_user_permissions = IF(@user_permissions_table_exists > 0, 'ALTER TABLE user_permissions MODIFY user_snowflake VARCHAR(50) NOT NULL', 'DO 0');
PREPARE stmt10 FROM @modify_user_permissions;
EXECUTE stmt10;
DEALLOCATE PREPARE stmt10;

-- 3. 테이블이 존재하는 경우에만 FK 재생성 시도
SET @add_musics_fk = IF(@musics_table_exists > 0, 'ALTER TABLE musics ADD CONSTRAINT fk_musics_guilds FOREIGN KEY (guild_snowflake) REFERENCES guilds (snowflake)', 'DO 0');
PREPARE stmt11 FROM @add_musics_fk;
EXECUTE stmt11;
DEALLOCATE PREPARE stmt11;

SET @add_observations_fk = IF(@observations_table_exists > 0, 'ALTER TABLE observations ADD CONSTRAINT fk_observations_guilds FOREIGN KEY (guild_snowflake) REFERENCES guilds (snowflake)', 'DO 0');
PREPARE stmt12 FROM @add_observations_fk;
EXECUTE stmt12;
DEALLOCATE PREPARE stmt12;

SET @add_password_note_fk = IF(@password_note_table_exists > 0, 'ALTER TABLE password_note ADD CONSTRAINT fk_password_note_guild FOREIGN KEY (guild_snowflake) REFERENCES guilds (snowflake)', 'DO 0');
PREPARE stmt13 FROM @add_password_note_fk;
EXECUTE stmt13;
DEALLOCATE PREPARE stmt13;

SET @add_records_fk = IF(@records_table_exists > 0, 'ALTER TABLE records ADD CONSTRAINT fk_records_guilds FOREIGN KEY (guild_snowflake) REFERENCES guilds (snowflake)', 'DO 0');
PREPARE stmt14 FROM @add_records_fk;
EXECUTE stmt14;
DEALLOCATE PREPARE stmt14;

SET @add_user_permissions_fk = IF(@user_permissions_table_exists > 0, 'ALTER TABLE user_permissions ADD CONSTRAINT fk_user_permissions_discord_users FOREIGN KEY (user_snowflake) REFERENCES discord_users (snowflake)', 'DO 0');
PREPARE stmt15 FROM @add_user_permissions_fk;
EXECUTE stmt15;
DEALLOCATE PREPARE stmt15;

-- 4. 안전한 인덱스 확인 및 생성
-- 이미 02-create-tables.template.sql과 02b-create-tables-rest.template.sql에서
-- 안전하게 처리되었으므로 여기서는 추가 작업이 필요 없음