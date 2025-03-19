USE ${DB_DISCORD};

/**
  사용자 테이블
 */
CREATE TABLE IF NOT EXISTS `users`
(
    `id`            UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`               UUID PRIMARY KEY COMMENT '내부 고유 식별자',
    `owner_snowflake`  VARCHAR(50) NOT NULL COMMENT '길드 소유자 user discord id',
    `snowflake`        VARCHAR(50) NOT NULL UNIQUE COMMENT 'snowflake discord 길드 ID',
    `name`             VARCHAR(255) NOT NULL COMMENT '길드 이름',
    `is_withdraw`      BOOLEAN NOT NULL DEFAULT 0 COMMENT '삭제여부',
    CONSTRAINT `fk_guilds_users` FOREIGN KEY (`owner_snowflake`) REFERENCES `users`(`snowflake`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='길드 테이블';



/**
  음악 테이블
 */
CREATE TABLE IF NOT EXISTS `musics`
(
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `character_id`      UUID NOT NULL COMMENT 'USER 테이블 내부 고유 식별자',
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
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID PRIMARY KEY COMMENT '내부 고유 식별자 및 코드',
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
    `id`        UUID PRIMARY KEY COMMENT '내부 고유 식별자',
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
    `id`                UUID NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord user snowflake',
    `permission_id`     UUID NOT NULL COMMENT 'permission table id',
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
    `id`                UUID NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `guild_snowflake`   VARCHAR(50) DEFAULT NULL COMMENT '디스코드 길드 snowflake',
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
    `id`                UUID NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord user snowflake',
    `permission_id`     UUID DEFAULT NULL COMMENT 'permission table 식별자',
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
