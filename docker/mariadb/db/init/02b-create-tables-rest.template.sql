USE ${DB_DISCORD};

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
CREATE TABLE IF NOT EXISTS `character_roles`
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
    `user_id`           BINARY(16) DEFAULT NULL COMMENT '사용자 id',
    `expired_at`        TIMESTAMP NOT NULL COMMENT '쿠폰 등록 마감 기한',
    CONSTRAINT `fk_coupons_users` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
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
    `duration`  INT NOT NULL DEFAULT 28 COMMENT '권한 유지기간 (달)',
    `info`      VARCHAR(500) DEFAULT "없음" COMMENT '권한 설명'
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='권한 테이블';



/**
  각 유저 별 권한 테이블
 */
CREATE TABLE IF NOT EXISTS `user_permissions`
(
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT 'discord user snowflake',
    `permission_id`     BINARY(16) NOT NULL COMMENT 'permission table id',
    `expired_at`       TIMESTAMP NOT NULL COMMENT '만료 날짜',
    CONSTRAINT `fk_user_permissions_permissions` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`)
	    ON DELETE CASCADE
	    ON UPDATE CASCADE,
    CONSTRAINT `fk_user_permissions_discord_users` FOREIGN KEY (`user_snowflake`) REFERENCES `discord_users`(`snowflake`)
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
CREATE TABLE IF NOT EXISTS `point_histories` (
    `id`                BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자',

    `user_id`           BINARY(16) NOT NULL COMMENT '포인트 사용 유저 (users.id)',
    `related_user_id`   BINARY(16) DEFAULT NULL COMMENT '거래 상대 유저 (users.id)',

    `type`              VARCHAR(50) NOT NULL COMMENT '거래 유형 (ex: 충전, 사용, 송금 등)',
    `amount`            INT NOT NULL COMMENT '변동 포인트 수량',
    `balance_after`     INT NOT NULL COMMENT '변경 후 잔액',

    `item_type`         VARCHAR(50) DEFAULT NULL COMMENT '관련 아이템 타입 (ex: 쿠폰, 상품 등)',
    `item_id`           BINARY(16) DEFAULT NULL COMMENT '관련 아이템 고유 ID',

    `permission_id`     BINARY(16) DEFAULT NULL COMMENT '관련 권한(permission) ID',

    `memo`              TEXT DEFAULT NULL COMMENT '관리자 메모 또는 설명',

    `used_at`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '사용 시각',

    CONSTRAINT `fk_point_histories_user`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT `fk_point_histories_related_user`
        FOREIGN KEY (`related_user_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT `fk_point_histories_permission`
        FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='포인트 변동 기록 테이블';


/*
    버튼 매크로용 테이블
*/
CREATE TABLE IF NOT EXISTS `groups` (
  `id` BINARY(16)       NOT NULL,
  `name` VARCHAR(255)   NOT NULL,
  `guild_snowflake` VARCHAR(30) NOT NULL,
  `index` INT           NOT NULL,
  `created_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_groups_guild_name` (`guild_snowflake`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



/*
    버튼 그룹 내부 버튼, 콘텐츠 테이블
*/

CREATE TABLE IF NOT EXISTS `group_items` (
  `id` BINARY(16)       NOT NULL,
  `group_id` BINARY(16) NOT NULL,
  `type` ENUM('BUTTON','CONTENT') NOT NULL,
  `parent_id` BINARY(16) NULL,
  `name` VARCHAR(255)   NULL,
  `text` TEXT           NULL,
  `channel_id` VARCHAR(36) NULL,
  `index` INT           NOT NULL,
  `created_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_items_group_type_name` (`group_id`, `type`, `name`),
  CONSTRAINT `fk_group_items_group`
    FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



/*

    commands
    
*/
CREATE TABLE IF NOT EXISTS `commands` (
  `id` BINARY(16) NOT NULL
    COMMENT '고유 식별자(UUID, 16바이트 이진 저장) – 애플리케이션에서 UNHEX(REPLACE(UUID(),"-",""))로 삽입',
  
  `name` VARCHAR(255) NOT NULL
    COMMENT '명령어 이름(유니크, 예: "/계산")',

  `description` TEXT NOT NULL
    COMMENT '명령어 설명(간단한 안내 문구)',

  `usage_example` VARCHAR(255) NOT NULL
    COMMENT '사용법 예시(예: "/계산 계산식:[계산식]")',

  `category` VARCHAR(100) NOT NULL
    COMMENT '카테고리(예: "유틸리티", "게임" 등)',

  `required_permissions` LONGTEXT NOT NULL
    COMMENT '필수 권한 목록(JSON 배열, 예: ["공통"])',

  `content` TEXT NOT NULL
    COMMENT '명령어 상세 내용(Markdown 등으로 저장)',

  `created_at` DATETIME(6) NOT NULL
    DEFAULT CURRENT_TIMESTAMP(6)
    COMMENT '레코드 생성 시각(UTC, 자동 설정)',

  `updated_at` DATETIME(6) NOT NULL
    DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
    COMMENT '레코드 최종 수정 시각(UTC, 자동 갱신)',

  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_commands_name` (`name`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='디스코드 명령어 정보 저장 테이블';

CREATE TABLE IF NOT EXISTS notices (
    id          BINARY(16)  PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    content     TEXT         NOT NULL,
    summary     VARCHAR(300) NOT NULL,
    notice_type ENUM('SYSTEM','EVENT','UPDATE') NOT NULL DEFAULT 'SYSTEM',
    is_pinned   BOOLEAN      NOT NULL DEFAULT FALSE,
    order_index INT          DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notice_type(created_at, notice_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `game_theme_recommendations` (
  `id`          BINARY(16) PRIMARY KEY,
  `web_user_id`     BINARY(16) NOT NULL,
  `theme_id`    BINARY(16) NOT NULL,
  `created_at`  TIMESTAMP DEFAULT now(),
  CONSTRAINT `fk_gametheme_recommendations_user_id`
    FOREIGN KEY (`web_user_id`) REFERENCES `web_users` (`id`),
  CONSTRAINT `fk_gametheme_recommendations_theme_id`
    FOREIGN KEY (`theme_id`) REFERENCES `game_themes` (`id`),
  UNIQUE KEY `uk_gametheme_recommendations_user_theme` (`web_user_id`, `theme_id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci
  COMMENT='게임 테마 추천 정보 테이블';
