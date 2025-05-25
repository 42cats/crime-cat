USE ${DB_DISCORD};

/**
  사용자 테이블
 */
CREATE TABLE IF NOT EXISTS `discord_users`
(
    `id`            BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `snowflake`     VARCHAR(50) NOT NULL UNIQUE COMMENT '디스코드 유저 snowflake',
    `name`          VARCHAR(100) NOT NULL COMMENT '디스코드 아이디',
    `avatar`        VARCHAR(255) NOT NULL COMMENT '프로필 사진 url',
    `discord_alarm` BOOLEAN NOT NULL COMMENT '디코 봇 알림 설정 여부',
    `created_at`    TIMESTAMP NOT NULL COMMENT '개인정보 동의 시점',
    `is_withdraw`   BOOLEAN NOT NULL DEFAULT 0 COMMENT '삭제 여부'
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='디스코드 사용자 정보 테이블';

CREATE TABLE IF NOT EXISTS `web_users` (
    `id` BINARY(16) NOT NULL COMMENT 'UUID 기반 기본키',
    `email_verified` BIT(1) NOT NULL DEFAULT b'0' COMMENT '이메일 인증 여부',
    `is_active`     BIT(1) NOT NULL DEFAULT b'1' COMMENT '활성화 여부',
    `is_banned`     BIT(1) NOT NULL DEFAULT b'0' COMMENT '정지 여부',
    `created_at`    DATETIME(6) DEFAULT NULL COMMENT '계정 생성일',
    `last_login_at` DATETIME(6) DEFAULT NULL COMMENT '마지막 로그인 일시',
    `discord_user_id` VARCHAR(50) DEFAULT NULL COMMENT '디스코드 사용자 ID',
    `nickname`        VARCHAR(50) NOT NULL COMMENT '사용자 닉네임',
    `email`           VARCHAR(100) DEFAULT NULL COMMENT '이메일 주소',
    `bio`             TEXT DEFAULT NULL COMMENT '자기소개',
    `password_hash`   VARCHAR(255) DEFAULT NULL COMMENT '비밀번호 해시',
    `profile_image_path` VARCHAR(255) DEFAULT NULL COMMENT '프로필 이미지 경로',
    `settings` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '유저 설정 (JSON)',
    `social_links` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'SNS 링크 (JSON)',
    `email_alarm` BIT(1) NOT NULL DEFAULT b'0' COMMENT '이메일 수신설정',
    `login_method` ENUM('DISCORD', 'GOOGLE', 'LOCAL') NOT NULL COMMENT '로그인 방식',
    `role`         ENUM('ADMIN', 'MANAGER', 'USER') NOT NULL COMMENT '권한 등급',
    PRIMARY KEY (`id`),
    CONSTRAINT `UK_web_users_discord_user_id` UNIQUE (`discord_user_id`),
    CONSTRAINT `UK_web_users_email` UNIQUE (`email`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
COMMENT='웹 사용자 정보 테이블';


/*

    users

*/
CREATE TABLE IF NOT EXISTS `users` (
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `discord_snowflake` VARCHAR(50) UNIQUE COMMENT '디스코드 유저 snowflake',
    `web_user_id`       BINARY(16) DEFAULT NULL COMMENT '웹 유저 아이디',
    `point`             INT NOT NULL DEFAULT 0 COMMENT '보유 포인트',
    `is_withdraw`       BOOLEAN NOT NULL DEFAULT FALSE COMMENT '탈퇴 여부',
    `discord_user_id`   BINARY(16) DEFAULT NULL COMMENT '디스코드 유저 아이디',
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    CONSTRAINT `fk_web_user` FOREIGN KEY (`web_user_id`) REFERENCES web_users(`id`)
        ON DELETE SET NULL,
    CONSTRAINT `fk_discord_user` FOREIGN KEY (`discord_user_id`) REFERENCES discord_users(`id`)
        ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT '통합 유저 테이블';



/**
  길드 테이블
 */
CREATE TABLE IF NOT EXISTS `guilds` (
    `id`               BINARY(16) NOT NULL PRIMARY KEY COMMENT '내부 고유 식별자 (UUID)',
    `snowflake`        VARCHAR(50) NOT NULL UNIQUE COMMENT '디스코드 길드 스노우플레이크 ID',
    `name`             VARCHAR(255) NOT NULL COMMENT '길드 이름',
    `is_withdraw`      BOOLEAN NOT NULL DEFAULT 0 COMMENT '삭제 여부',
    `owner_snowflake`  VARCHAR(50) NOT NULL COMMENT '디스코드 유저 스노우플레이크 ID',
    `owner_user_id`    BINARY(16) COMMENT '길드 소유자 User UUID',
    `created_at`       TIMESTAMP NOT NULL COMMENT '길드 생성 시점',
    CONSTRAINT `fk_guilds_users` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='디스코드 길드 정보 테이블';


/**
  비번 테이블
*/
CREATE TABLE IF NOT EXISTS `password_note` (
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

/*
    maker_teams
*/
CREATE TABLE IF NOT EXISTS `maker_teams` (
    `id`            BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `name`          VARCHAR(50) NOT NULL COMMENT '팀 이름',
    `is_individual` tinyint(1) NOT NULL DEFAULT 0 COMMENT '개인 팀 여부'
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT '제작 팀 테이블';

/*
    maker_team_members
*/
CREATE TABLE IF NOT EXISTS `maker_team_members` (
     `id`         BINARY(16) PRIMARY KEY,
     `team_id`    BINARY(16),
     `name`       VARCHAR(50),
     `web_user_id`    BINARY(16),
     `is_leader`  BOOLEAN NOT NULL DEFAULT FALSE,

     CONSTRAINT `fk_team_id` FOREIGN KEY (`team_id`) REFERENCES `maker_teams`(`id`)
         ON DELETE CASCADE,
     CONSTRAINT `fk_web_user_id` FOREIGN KEY (`web_user_id`) REFERENCES `web_users`(`id`)
 ) ENGINE = InnoDB
 DEFAULT CHARSET = utf8mb4
 COLLATE = utf8mb4_unicode_ci
 COMMENT = '제작 팀 멤버 테이블';

/*
    game_themes
*/
CREATE TABLE IF NOT EXISTS `game_themes` (
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `title`             VARCHAR(255) NOT NULL COMMENT '테마 제목',
    `thumbnail`         TEXT COMMENT '썸네일 이미지',
    `summary`           TEXT COMMENT '간략 설명',
    `recommendations`   INT DEFAULT 0 COMMENT '추천수',
    `views`             INT DEFAULT 0 COMMENT '조회수',
    `play_count`        INT DEFAULT 0 COMMENT '총 플레이 횟수',
    `author`            BINARY(16) NOT NULL COMMENT '작성자 (web_users.id 참조)',
    `tags`              LONGTEXT COMMENT '태그 배열 ["tag1", "tag2"]',
    `content`           TEXT COMMENT '게시글 본문',
    `player_min`        INT COMMENT '최소 인원수',
    `player_max`        INT COMMENT '최대 인원수',
    `playtime_min`      INT COMMENT '최소 소요시간 (분)',
    `playtime_max`      INT COMMENT '최대 소요시간 (분)',
    `price`             INT COMMENT '금액 (원화)',
    `difficulty`        INT COMMENT '난이도',
    `is_public`         BOOLEAN DEFAULT TRUE COMMENT '공개 여부',
    `is_deleted`        BOOLEAN DEFAULT FALSE COMMENT '소프트 삭제 여부',
    `type`              VARCHAR(50) NOT NULL COMMENT 'CRIMESCENE, ESCAPE_ROOM, MURDER_MYSTERY, REALWORLD',
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_author` FOREIGN KEY (`author`)
        REFERENCES `web_users`(`id`)
        ON DELETE CASCADE

) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT '게임 테마 테이블';

/*
    crimescene_themes
*/
CREATE TABLE IF NOT EXISTS `crimescene_themes` (
     `game_theme_id`     BINARY(16) PRIMARY KEY COMMENT '게임 테마',
     `maker_teams_id`     BINARY(16) COMMENT '제작 팀 정보',
     `guild_snowflake`   VARCHAR(50) COMMENT '디스코드 서버 id',
     `extra`             LONGTEXT COMMENT '추가 정보 (JSON)'
         CHECK (JSON_VALID(`extra`)),
     CONSTRAINT `fk_maker_teams_id` FOREIGN KEY (`maker_teams_id`)
         REFERENCES `maker_teams`(`id`)
         ON DELETE SET NULL,
     CONSTRAINT `fk_guild_snowflake` FOREIGN KEY (`guild_snowflake`)
         REFERENCES `guilds`(`snowflake`)
         ON DELETE CASCADE
 ) ENGINE = InnoDB
   DEFAULT CHARSET = utf8mb4
   COLLATE = utf8mb4_unicode_ci
   COMMENT = '크라임씬 테마 테이블';


CREATE TABLE IF NOT EXISTS `game_histories`
(
    `id`                BINARY(16) PRIMARY KEY COMMENT '내부 고유 식별자',
    `user_snowflake`    VARCHAR(50) NOT NULL COMMENT '디스코드 user snowflake',
    `guild_snowflake`   VARCHAR(50) NOT NULL COMMENT '디스코드 guild snowflake',
    `game_theme_id`     BINARY(16) DEFAULT NULL COMMENT '게임 테마 ID', -- 수정됨!
    `is_win`            BOOLEAN NULL DEFAULT FALSE COMMENT '승리 여부',
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '기록 생성 시간',
    `character_name`    VARCHAR(50) DEFAULT NULL COMMENT '캐릭터 이름',
    `memo`              VARCHAR(1000) DEFAULT NULL COMMENT '유저 플레이 기록 메모',
    `owner_memo`        VARCHAR(1000) DEFAULT NULL COMMENT '오너 플레이 기록 메모',
    CONSTRAINT `fk_game_histories_discord_users` FOREIGN KEY (`user_snowflake`) REFERENCES `discord_users`(`snowflake`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_game_histories_guilds` FOREIGN KEY (`guild_snowflake`) REFERENCES `guilds`(`snowflake`)
        ON DELETE CASCADE,
    CONSTRAINT `fk_game_histories_game_themes`
        FOREIGN KEY (`game_theme_id`) REFERENCES `game_themes`(`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
    COMMENT='게임 기록 테이블';

-- 유저 + 생성일 내림차순 인덱스
SET @user_created_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_histories'
    AND index_name = 'idx_game_histories_user_created_at');
CREATE INDEX idx_game_histories_user_created_at
ON game_histories (user_snowflake, created_at DESC);

-- 게임 테마 기준 인덱스 (통계용)
CREATE INDEX idx_game_histories_game_theme
ON game_histories (game_theme_id);





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
CREATE TABLE `user_permissions`
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
CREATE TABLE `point_histories` (
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
CREATE TABLE `commands` (
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

-- 게임 테마 인덱스 존재 확인
SET @game_theme_index_exists = (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = '${DB_DISCORD}' AND table_name = 'game_histories'
    AND index_name = 'idx_game_histories_game_theme');

-- 인덱스가 없는 경우에만 생성
SET @create_user_created_index = IF(@user_created_index_exists = 0, 'CREATE INDEX idx_game_histories_user_created_at ON game_histories (user_snowflake, created_at DESC)', 'DO 0');
PREPARE stmt1 FROM @create_user_created_index;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @create_game_theme_index = IF(@game_theme_index_exists = 0, 'CREATE INDEX idx_game_histories_game_theme ON game_histories (game_theme_id)', 'DO 0');
PREPARE stmt2 FROM @create_game_theme_index;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
