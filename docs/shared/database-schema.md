# 데이터베이스 스키마

## 🗄️ 데이터베이스 구조

### 연결 정보
- **데이터베이스**: MariaDB 10.6+
- **포트**: 3306
- **스키마**: `discord`
- **연결풀**: HikariCP
- **마이그레이션**: Flyway

## 📋 주요 테이블

### 사용자 관리
```sql
-- 중앙 사용자 테이블
CREATE TABLE users (
    id BINARY(16) PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Discord 사용자 (봇 전용)
CREATE TABLE discord_users (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    snowflake VARCHAR(20) UNIQUE NOT NULL,  -- Discord Snowflake ID
    notification_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 웹 사용자 (웹앱 전용)
CREATE TABLE web_users (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    discord_user_snowflake VARCHAR(20),     -- Discord 연동
    email VARCHAR(255),
    oauth_provider VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 일정 관리 시스템
```sql
-- 메인 이벤트 테이블
CREATE TABLE events (
    id BINARY(16) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by BINARY(16) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_participants INT DEFAULT 10,
    is_secret BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES web_users(id) ON DELETE CASCADE
);

-- 이벤트 참여자
CREATE TABLE event_participants (
    id BINARY(16) PRIMARY KEY,
    event_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);

-- 외부 캘린더 통합 (iCal)
CREATE TABLE user_calendars (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    calendar_name VARCHAR(100) NOT NULL,
    ical_url TEXT NOT NULL,
    color_index INT DEFAULT 0,              -- 0-7 색상 인덱스
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);

-- 사용자 차단 날짜 (비트맵 최적화)
CREATE TABLE user_blocked_periods (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    blocked_dates_bitmap VARBINARY(12) NOT NULL,  -- 90일을 12바이트로 압축
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES web_users(id) ON DELETE CASCADE
);

-- AI 추천 시간
CREATE TABLE recommended_times (
    id BINARY(16) PRIMARY KEY,
    event_id BINARY(16) NOT NULL,
    recommended_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    participant_count INT DEFAULT 0,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### 게임 테마 시스템
```sql
-- 게임 테마
CREATE TABLE game_themes (
    id BINARY(16) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme_type ENUM('CRIMESCENE', 'ESCAPE_ROOM') NOT NULL,
    difficulty_level INT DEFAULT 1,
    max_participants INT DEFAULT 6,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 게임 기록
CREATE TABLE game_histories (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    game_theme_id BINARY(16) NOT NULL,
    played_at DATETIME NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_theme_id) REFERENCES game_themes(id) ON DELETE CASCADE
);
```

## 🔄 엔티티 관계도

### 사용자 시스템
```
    User (중앙)
    ├── DiscordUser (1:1) ── Discord 봇 데이터
    └── WebUser (1:1) ─── 웹 애플리케이션 데이터
            │
            ├── Events (1:N) ─── 생성한 이벤트
            ├── EventParticipants (1:N) ─── 참여한 이벤트  
            ├── UserCalendars (1:N) ─── 연동 캘린더
            └── UserBlockedPeriods (1:N) ─── 차단 날짜
```

### 일정 시스템
```
    Event
    ├── EventParticipants (1:N)
    ├── RecommendedTimes (1:N)
    └── Creator: WebUser (N:1)
    
    UserCalendar
    ├── Owner: WebUser (N:1)
    └── iCal URL + Color Settings
```

## 📊 인덱스 전략

### 성능 최적화 인덱스
```sql
-- Discord 사용자 조회 (봇에서 자주 사용)
CREATE INDEX idx_discord_users_snowflake ON discord_users(snowflake);

-- 이벤트 조회 (날짜 범위)
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_created_by ON events(created_by);

-- 참여자 조회
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);

-- 캘린더 조회 (활성 상태)
CREATE INDEX idx_user_calendars_user_active ON user_calendars(user_id, is_active);

-- 게임 기록 조회
CREATE INDEX idx_game_histories_user_played ON game_histories(user_id, played_at);
```

## 🔧 마이그레이션 파일

### Flyway 마이그레이션 구조
```
backend/src/main/resources/db/migration/
├── V20241215_001__Create_events_table.sql
├── V20241215_002__Create_event_participants_table.sql  
├── V20241215_003__Create_user_calendars_table.sql
├── V20241215_004__Create_user_blocked_periods_table.sql
├── V20241215_005__Create_recommended_times_table.sql
├── V20241215_006__Add_schedule_indexes.sql
├── V20241215_007__Add_calendar_constraints.sql
└── V20241215_008__Initialize_schedule_data.sql
```

## 🚀 성능 고려사항

### 비트맵 최적화
- **user_blocked_periods.blocked_dates_bitmap**: 90일 → 12바이트 압축
- **공간 절약**: 99% 저장공간 절약 달성
- **검색 성능**: O(1) 날짜 활성화/비활성화 연산

### UUID 사용
- **BINARY(16)**: MySQL UUID 최적화
- **성능**: VARCHAR(36) 대비 50% 공간 절약
- **인덱스**: 더 빠른 JOIN 성능

### 파티셔닝 전략
```sql
-- 이벤트 테이블 월별 파티셔닝 (대량 데이터 시)
ALTER TABLE events 
PARTITION BY RANGE (YEAR(start_time) * 100 + MONTH(start_time)) (
    PARTITION p202501 VALUES LESS THAN (202502),
    PARTITION p202502 VALUES LESS THAN (202503),
    -- ...
);
```

## 🔗 관련 문서
- [백엔드 데이터베이스 아키텍처](../backend/architecture/database.md)
- [API 계약서](api-contracts.md)
- [배포 가이드](deployment.md)