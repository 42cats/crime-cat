USE ${DB_DISCORD};

/**
  사용자 테이블
 */
CREATE TABLE IF NOT EXISTS `users`
(
    `id`            BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `snowflake`     VARCHAR(50) NOT NULL UNIQUE COMMENT '디스코드 유저 snowflake',
    `name`          VARCHAR(100) NOT NULL COMMENT '디스코드 아이디',
    `avatar`        VARCHAR(255) NOT NULL COMMENT '프로필 사진 url',
    `discord_alarm` BOOLEAN NOT NULL COMMENT '디코 봇 알림 설정 여부',
    `point`         INT NOT NULL DEFAULT 0 COMMENT '보유 포인트',
    `created_at`    TIMESTAMP NOT NULL COMMENT '개인정보 동의 시점',
    `is_withdraw`   BOOLEAN NOT NULL DEFAULT 0 COMMENT '삭제 여부'
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='사용자 정보 테이블';



/**
  길드 테이블
 */
CREATE TABLE IF NOT EXISTS `guilds` (
    `id`               BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `owner_snowflake`  VARCHAR(50) NOT NULL COMMENT '길드 소유자 user discord id',
    `snowflake`        VARCHAR(50) NOT NULL UNIQUE COMMENT 'snowflake discord 길드 ID',
    `name`             VARCHAR(255) NOT NULL COMMENT '길드 이름',
    `is_withdraw`      BOOLEAN NOT NULL DEFAULT 0 COMMENT '삭제여부',
    `created_at`       TIMESTAMP NOT NULL COMMENT '길드 생성시점(discord 에서 최초생성시기)',
    CONSTRAINT `fk_guilds_users` FOREIGN KEY (`owner_snowflake`) REFERENCES `users`(`snowflake`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='길드 테이블';

/**
  비번 테이블
*/
CREATE TABLE `password_note` (
    `id` BINARY(16) NOT NULL COMMENT 'BINARY(16) 형식의 고유 식별자',
    `guild_snowflake` VARCHAR(50) NOT NULL COMMENT '연결된 길드의 Snowflake ID',
    `channel_snowflake` VARCHAR(50) NOT NULL COMMENT '길드의 채널 Snowflake ID',
    `password_key` VARCHAR(255) NOT NULL COMMENT '비번 키 (고유값)',
    `content` TEXT NOT NULL COMMENT '저장된 내용',
    `created_at` TIMESTAMP NOT NULL COMMENT '생성 시간',
    
    PRIMARY KEY (`id`),
    
    -- ✅ 동일한 길드 내에서만 password_key 중복 방지
    UNIQUE KEY `uk_guild_password_key` (`guild_snowflake`, `password_key`),
    
    -- 🔗 외래키 설정
    KEY `fk_password_note_guild` (`guild_snowflake`),
    CONSTRAINT `fk_password_note_guild`
        FOREIGN KEY (`guild_snowflake`)
        REFERENCES `guilds` (`snowflake`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '비밀번호 노트 저장 테이블';



/**
  음악 테이블
 */
CREATE TABLE IF NOT EXISTS `musics`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 길드 snowflake',
    `title`             VARCHAR(255) NOT NULL COMMENT '음악 제목',
    `youtube_url`       VARCHAR(2048) NOT NULL COMMENT 'URL 주소',
    `thumbnail`         VARCHAR(2048) NOT NULL COMMENT 'URL 섬네일',
    `duration`          VARCHAR(255) NOT NULL COMMENT '재생 시간',
    `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 시간',
    CONSTRAINT `fk_musics_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `uk_musics_guild_title` UNIQUE (`guild_snowflake`, `title`)
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='길드 music 테이블';



/**
  게임 기록 테이블
 */
CREATE TABLE IF NOT EXISTS `game_histories`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT '디스코드 user snowflake',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 guild snowflake',
    `is_win`            BOOLEAN NULL DEFAULT NULL COMMENT '승리 여부',
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 생성 시간',
    `character_name`    VARCHAR(50) DEFAULT NULL COMMENT '캐릭터 이름',
    CONSTRAINT `fk_game_histories_users` FOREIGN KEY (`user_snowflake`) REFERENCES `users`(`snowflake`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_game_histories_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='게임 기록 테이블';



/**
  각 길드당 삭제할 채널 테이블
 */
CREATE TABLE IF NOT EXISTS `cleans`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 길드 snowflake',
    `channel_snowflake` VARCHAR(50) NOT NULL UNIQUE COMMENT '디스코드 채널 snowflake',
    CONSTRAINT `fk_cleans_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='청소 테이블';


/**
  길드 내 캐릭터 테이블
 */
CREATE TABLE IF NOT EXISTS `characters`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '문자열 길드 ID',
    `name`              VARCHAR(50) NOT NULL COMMENT '게임 내 캐릭터 이름',
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    CONSTRAINT `fk_characters_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
		CONSTRAINT `uk_characters_guild_name` UNIQUE (`guild_snowflake`, `name`)
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='캐릭터 테이블';


/**
  각 캐릭터 당 discord role 테이블
 */
CREATE TABLE `character_roles`
(
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `character_id`      BINARY(16) NOT NULL COMMENT 'USER 테이블 내부 고유 식별자',
    `role_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord role snowflake',
    CONSTRAINT `fk_character_roles_characters` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`)
	    ON DELETE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='캐릭터 role 테이블';



/**
 * 채널 별 기본 메시지 테이블
 */
CREATE TABLE IF NOT EXISTS `records`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 길드 snowflake',
    `channel_snowflake` VARCHAR(50) NOT NULL COMMENT '디스코드 채널 snowflake',
    `message`           TEXT NOT NULL COMMENT '메시지 내용(최대 5000자)',
    `index`             INT NOT NULL COMMENT '표출 순서(저장된 순서)',
    CONSTRAINT `fk_records_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='채널 별 기본 메시지 테이블';



/**
  쿠폰 테이블
 */
CREATE TABLE IF NOT EXISTS `coupons`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자 및 코드',
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발행 시각',
    `used_at`           TIMESTAMP DEFAULT NULL COMMENT '사용 시각',
    `point`             INT NOT NULL DEFAULT 0 COMMENT '발행 포인트',
    `user_snowflake`    VARCHAR(50) DEFAULT NULL COMMENT '디스코드 사용자 snowflake',
    `expired_at`       TIMESTAMP NOT NULL COMMENT '쿠폰 등록 마감 기한',
    CONSTRAINT `fk_coupons_users` FOREIGN KEY (`user_snowflake`) REFERENCES `users`(`snowflake`)
        ON DELETE SET NULL
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='쿠폰 테이블';



/**
  권한 테이블
 */
CREATE TABLE IF NOT EXISTS `permissions`
(
    `id`        BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `name`      VARCHAR(255) NOT NULL UNIQUE COMMENT '권한 이름',
    `price`     INT NOT NULL DEFAULT 0 COMMENT '권한 가격',
    `duration`  INT NOT NULL DEFAULT 28 COMMENT '권한 유지기간 (달)'
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='권한 테이블';



/**
  각 유저 별 권한 테이블
 */
CREATE TABLE `user_permissions`
(
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord user snowflake',
    `permission_id`     BINARY(16) NOT NULL COMMENT 'permission table id',
    `expired_at`       TIMESTAMP NOT NULL COMMENT '만료 날짜',
    CONSTRAINT `fk_user_permissions_permissions` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`)
	    ON DELETE CASCADE
	    ON UPDATE CASCADE,
    CONSTRAINT `fk_user_permissions_users` FOREIGN KEY (`user_snowflake`) REFERENCES `users`(`snowflake`)
	    ON DELETE CASCADE
	    ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='사용자 권한 테이블';



/**
  관전자 테이블
 */
CREATE TABLE IF NOT EXISTS `observations`
(
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 길드 snowflake',
    `head_title`        VARCHAR(10) DEFAULT '- 관전' COMMENT '길드 내의 관전자 이름 앞의 prefix',
    `role_snowflake`    VARCHAR(50) DEFAULT NULL COMMENT '관전자 role snowflake(discord)',
    CONSTRAINT `fk_observations_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
	    ON DELETE CASCADE
	    ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='관전 설정 테이블';



/**
  각 유저 별 기록 테이블
 */
CREATE TABLE `point_histories`
(
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord user snowflake',
    `permission_id`     BINARY(16) DEFAULT NULL COMMENT 'permission table 식별자',
    `point`             INT NOT NULL COMMENT '입출 포인트',
    `used_at`           TIMESTAMP NOT NULL COMMENT '포인트 입출 날짜',
    CONSTRAINT `fk_point_histories_users` FOREIGN KEY (`user_snowflake`) REFERENCES `users`(`snowflake`)
	    ON DELETE CASCADE
		ON UPDATE CASCADE,
    CONSTRAINT `fk_point_histories_permissions` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`)
	    ON DELETE CASCADE
		ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='포인트 사용 기록 테이블';


### 📁 2. `oauth_tokens` – Refresh Token 저장 테이블
CREATE TABLE `web_users` (
<<<<<<< Updated upstream
  `id` BINARY(16) NOT NULL PRIMARY KEY,                           -- 내부BINARY(16) 
  `discord_user_id` VARCHAR(50) UNIQUE DEFAULT NULL,               -- 디스코드 연동 snowflake (널 허용, 유니크)

  `login_method` ENUM('LOCAL', 'GOOGLE', 'DISCORD') NOT NULL DEFAULT 'local',
=======
  `id` UUID NOT NULL PRIMARY KEY,                           -- 내부 UUID
  `discord_user_id` VARCHAR(50) UNIQUE DEFAULT NULL,               -- 디스코드 연동 snowflake (널 허용, 유니크)

  `login_method` ENUM('local', 'oauth') NOT NULL DEFAULT 'local',
>>>>>>> Stashed changes
  `email` VARCHAR(100) UNIQUE DEFAULT NULL,                 -- ✅ NULL 허용 + UNIQUE
  `email_verified` BOOLEAN DEFAULT FALSE,
  `password_hash` VARCHAR(255),
  `nickname` VARCHAR(50) NOT NULL,
  `profile_image_path` VARCHAR(255),
  `bio` TEXT,

  `role` ENUM('USER', 'ADMIN', 'MANAGER') NOT NULL DEFAULT 'USER',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_banned` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  `settings` JSON DEFAULT NULL,
  `social_links` JSON DEFAULT NULL
<<<<<<< Updated upstream
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
=======
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `user_tokens` (
  `id` UUID NOT NULL PRIMARY KEY,                 -- UUID
  `web_user_id` UUID NOT NULL,                        -- FK → web_users(id)
  `provider` VARCHAR(20) NOT NULL DEFAULT 'discord',  -- 로그인 제공자 (discord, local 등)
  `refresh_token` TEXT NOT NULL,                      -- 암호화된 Refresh Token
  `jti` VARCHAR(255) NOT NULL,                        -- JWT 고유 식별자
  `expires_at` TIMESTAMP NOT NULL,                    -- 만료 시각
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 생성 시각
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 수정 시각

  CONSTRAINT `FK_user_tokens_web_user_id` FOREIGN KEY (`web_user_id`) REFERENCES `web_users` (`id`) ON DELETE CASCADE,
  INDEX (`web_user_id`),
  INDEX (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
>>>>>>> Stashed changes
