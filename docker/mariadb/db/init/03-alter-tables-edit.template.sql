USE ${DB_DISCORD};

-- 1. FK 삭제 (있어도, 없어도 안전하게)
ALTER TABLE musics          DROP FOREIGN KEY IF EXISTS fk_musics_guilds;
ALTER TABLE observations    DROP FOREIGN KEY IF EXISTS fk_observations_guilds;
ALTER TABLE password_note   DROP FOREIGN KEY IF EXISTS fk_password_note_guild;
ALTER TABLE records         DROP FOREIGN KEY IF EXISTS fk_records_guilds;
ALTER TABLE user_permissions DROP FOREIGN KEY IF EXISTS fk_user_permissions_discord_users;

-- 2. 컬럼 길이를 50자로 되돌림
ALTER TABLE musics          MODIFY guild_snowflake  VARCHAR(50) NOT NULL;
ALTER TABLE observations    MODIFY guild_snowflake  VARCHAR(50) NOT NULL;
ALTER TABLE password_note   MODIFY guild_snowflake  VARCHAR(50) NOT NULL;
ALTER TABLE records         MODIFY guild_snowflake  VARCHAR(50) NOT NULL;
ALTER TABLE user_permissions MODIFY user_snowflake  VARCHAR(50) NOT NULL;

-- 3. FK 재생성
ALTER TABLE musics
  ADD CONSTRAINT fk_musics_guilds
      FOREIGN KEY (guild_snowflake)
      REFERENCES guilds (snowflake);

ALTER TABLE observations
  ADD CONSTRAINT fk_observations_guilds
      FOREIGN KEY (guild_snowflake)
      REFERENCES guilds (snowflake);

ALTER TABLE password_note
  ADD CONSTRAINT fk_password_note_guild
      FOREIGN KEY (guild_snowflake)
      REFERENCES guilds (snowflake);

ALTER TABLE records
  ADD CONSTRAINT fk_records_guilds
      FOREIGN KEY (guild_snowflake)
      REFERENCES guilds (snowflake);

ALTER TABLE user_permissions
  ADD CONSTRAINT fk_user_permissions_discord_users
      FOREIGN KEY (user_snowflake)
      REFERENCES discord_users (snowflake);
