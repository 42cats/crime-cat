USE ${DB_DISCORD};

/**
 * users 테이블
 *  - id: 내부 PK (INT AUTO_INCREMENT)
 *  - user_id: Discord 등에서 가져온 식별자(문자열, UNIQUE)
 *  - name: 유저명
 *  - auth_token: 2FA 등 인증토큰 저장
 */
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '내부 고유 식별자',
    user_id VARCHAR(50) NOT NULL UNIQUE COMMENT '문자열 형태의 사용자 ID',
    name VARCHAR(100) DEFAULT NULL COMMENT '유저 이름',
    auth_token VARCHAR(255) DEFAULT NULL COMMENT '2FA 인증토큰 등 저장',
    point INT DEFAULT 0 COMMENT '사용자 포인트',
    grade BIGINT DEFAULT 0 COMMENT '사용자 등급',
    alert_ok tinyint(4) NOT NULL DEFAULT 0 COMMENT '알림설정',
    email varchar(255) DEFAULT NULL COMMENT '이메일',
    password varchar(255) DEFAULT NULL COMMENT '패스워드',
    provider enum('discord', 'onsite') NOT NULL DEFAULT 'discord' COMMENT '가입경로',
    last_play_date TIMESTAMP NULL COMMENT '마지막 플레이 시간',
    last_online TIMESTAMP NULL COMMENT '마지막 접속 시간',
    created_at TIMESTAMP NOT NULL COMMENT '계정 생성 시간',
    INDEX idx_last_online (last_online)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 정보 테이블';

/**
 * guild 테이블
 *  - id: 내부 PK (INT AUTO_INCREMENT)
 *  - guild_id: 문자열 형태(UNIQUE)
 *  - owner_id: users.user_id 참조
 *  - name: 길드명
 */
-- 새 guild 테이블
CREATE TABLE IF NOT EXISTS guild (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '내부 고유 식별자',
    guild_id VARCHAR(50) NOT NULL UNIQUE COMMENT '문자열 형태의 길드 ID',
    owner_id VARCHAR(50) NOT NULL COMMENT '길드 소유자(문자열 user_id)',
    guild_name VARCHAR(255) DEFAULT NULL COMMENT '길드 이름',
    guild_owner_name VARCHAR(255) DEFAULT NULL COMMENT '길드 오너의 별칭/이름',
    last_play_date TIMESTAMP NULL COMMENT '길드의 마지막 플레이 시간',
    created_at TIMESTAMP NOT NULL COMMENT '길드 생성 시간',
    observer VARCHAR(50) DEFAULT NULL COMMENT '관전역할',
    head_title VARCHAR(10) DEFAULT NULL COMMENT '관전자 타이틀',
    CONSTRAINT fk_guild_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


/**
 * guild_url 테이블
 *  - owner_id: guild.guild_id 참조 (문자열)
 */
CREATE TABLE IF NOT EXISTS guild_url (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'URL 고유 식별자',
    owner_id VARCHAR(50) NOT NULL COMMENT '길드 ID(문자열)',
    url VARCHAR(2048) NOT NULL COMMENT 'URL 주소',
    title VARCHAR(255) COMMENT 'URL 제목',
    thumbnail VARCHAR(2048) COMMENT 'URL 섬네일',
    duration VARCHAR(255) COMMENT '재생 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 시간',
    CONSTRAINT fk_guildurl_owner
        FOREIGN KEY (owner_id) REFERENCES guild(guild_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='길드 URL 테이블';

/**
 * user_url 테이블
 *  - owner_id: users.user_id 참조
 */
CREATE TABLE IF NOT EXISTS user_url (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'URL 고유 식별자',
    owner_id VARCHAR(50) NOT NULL COMMENT '사용자 ID(문자열)',
    url VARCHAR(2048) NOT NULL COMMENT 'URL 주소',
    title VARCHAR(255) COMMENT 'URL 제목',
    thumbnail VARCHAR(2048) COMMENT 'URL 섬네일',
    duration VARCHAR(255) COMMENT '재생 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 시간',
    CONSTRAINT fk_userurl_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 URL 테이블';

/**
 * history 테이블
 *  - user_id: users.user_id 참조
 *  - guild_id: guild.guild_id 참조
 */
CREATE TABLE IF NOT EXISTS history (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '기록 고유 식별자',
    user_id VARCHAR(50) NOT NULL COMMENT '문자열 사용자 ID',
    guild_id VARCHAR(50) COMMENT '문자열 길드 ID',
    is_win BOOLEAN NOT NULL DEFAULT FALSE COMMENT '승리 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 생성 시간',
    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_history_guild
        FOREIGN KEY (guild_id) REFERENCES guild(guild_id)
        ON DELETE SET NULL,
    INDEX idx_user_guild (user_id, guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게임 기록 테이블';

/**
 * clean 테이블
 *  - guild_id: guild.guild_id 참조
 *  - channel_id: 문자열
 *  - name: 추가된 열 (예: 채널별 별칭)
 */
CREATE TABLE IF NOT EXISTS clean (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'clean 테이블 고유 식별자',
    guild_id VARCHAR(50) NOT NULL COMMENT '문자열 길드 ID',
    channel_id VARCHAR(50) NOT NULL UNIQUE COMMENT '채널 ID(문자열)',
    name VARCHAR(255) DEFAULT NULL COMMENT '클린 기능에 사용할 이름',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    CONSTRAINT fk_clean_guild
        FOREIGN KEY (guild_id) REFERENCES guild(guild_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_clean_guild_id (guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='clean 테이블';

/**
 * characters (캐릭터) 테이블
 *  - guild_id: guild.guild_id 참조
 *  - character_name: 문자열
 *  - role_id: 문자열
 */
CREATE TABLE IF NOT EXISTS characters (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'characters 테이블 고유 식별자',
    guild_id VARCHAR(50) NOT NULL COMMENT '문자열 길드 ID',
    character_name VARCHAR(50) NOT NULL UNIQUE COMMENT '캐릭터 이름',
    role_id VARCHAR(50) NULL COMMENT '캐릭터 롤(id)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    CONSTRAINT fk_characters_guild
        FOREIGN KEY (guild_id) REFERENCES guild(guild_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_characters_guild_id (guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='캐릭터 테이블';

/**
 * record 테이블
 *  - guild_id: guild.guild_id 참조
 */
CREATE TABLE IF NOT EXISTS record (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'record 테이블 고유 식별자',
    guild_id VARCHAR(50) NOT NULL COMMENT '문자열 길드 ID',
    msg VARCHAR(5000) COMMENT '메시지 내용(최대 5000자)',
    channel_id VARCHAR(50) COMMENT '채널 ID(문자열)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    CONSTRAINT fk_record_guild
        FOREIGN KEY (guild_id) REFERENCES guild(guild_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_record_guild_id (guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='record 테이블';



CREATE TABLE IF NOT EXISTS grade_code (
    code CHAR(12) NOT NULL COMMENT '랜덤 생성된 12자리 코드',
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '내부 고유 식별자',
    price INT NOT NULL DEFAULT 500 COMMENT '가격',
    user_id VARCHAR(50) NOT NULL COMMENT '문자열 사용자 ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜',
    is_used TIMESTAMP  DEFAULT NULL COMMENT '사용 여부'
    CONSTRAINT fk_grade_code_user
        FOREIGN KEY (user_id) REFERENCES user(user_id)
        ON DELETE SET NULL,

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='어트리 뷰트 테이블';