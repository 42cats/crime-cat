# Crime-Cat 개발 작업 가이드

## 📚 분산 문서 시스템

-   **[백엔드 개발 가이드](docs/backend/README.md)** - Spring Boot API 개발
-   **[프론트엔드 개발 가이드](docs/frontend/README.md)** - React 컴포넌트 개발
-   **[Discord 봇 개발 가이드](docs/discord-bot/README.md)** - Discord.js 명령어 개발
-   **[공통 정보](docs/shared/project-overview.md)** - 프로젝트 구조, API 계약, DB 스키마

## 🔧 현재 구현된 API

### 백엔드 API (Spring Boot)

```java
// 다중 캘린더 관리 API - /api/v1/my-calendar
CalendarController.java
├── GET /calendars                         # 사용자 캘린더 목록
├── POST /calendars                        # 새 캘린더 추가 (webcal 지원)
├── PUT /calendars/{id}                    # 캘린더 수정
├── DELETE /calendars/{id}                 # 캘린더 삭제
├── POST /calendars/{id}/sync              # 개별 동기화
├── POST /calendars/sync-all               # 전체 동기화
├── GET /color-palette                     # 색상 팔레트 조회
└── GET /events-in-range                   # 캘린더별 그룹화된 이벤트

// Discord 봇 전용 API - /bot/v1/schedule
BotScheduleController.java (Bearer Token 인증)
├── GET /user/{discordSnowflake}/my-schedule        # 내일정 조회
├── POST /user/{discordSnowflake}/check-overlap     # 일정 교차 체크
└── POST /user/{discordSnowflake}/refresh-cache     # 캐시 갱신

// 일정 관리 API - /api/v1/events
EventController.java
├── POST /events                           # 이벤트 생성
├── GET /events                           # 이벤트 목록 조회
├── POST /events/{eventId}/participate     # 이벤트 참여
└── DELETE /events/{eventId}/participate   # 이벤트 취소
```

### 프론트엔드 API 서비스

```typescript
// frontend/src/api/calendar.ts (apiClient 기반)
calendarService = {
  getGroupedCalendarEvents()    # 그룹화된 캘린더 이벤트 조회
  getUserCalendars()           # 사용자 캘린더 목록
  addCalendar()               # 캘린더 추가 (webcal 지원)
  updateCalendar()            # 캘린더 수정
  deleteCalendar()            # 캘린더 삭제
  syncCalendar()              # 개별 동기화
  syncAllCalendars()          # 전체 동기화
  getColorPalette()           # 색상 팔레트 조회
}

// frontend/src/hooks/useCalendarManagement.ts (React Query 기반)
useCalendarManagement = {
  calendars                   # 캘린더 목록 상태
  colorPalette               # 색상 팔레트 상태
  isLoading                  # 로딩 상태
  error                      # 에러 상태
  addCalendar()             # 캘린더 추가
  updateCalendar()          # 캘린더 수정
  deleteCalendar()          # 캘린더 삭제
  syncCalendar()            # 개별 동기화
  syncAllCalendars()        # 전체 동기화
  getGroupedEvents()        # 그룹화된 이벤트 조회
}
```

## 🧩 주요 컴포넌트 구조

### React 컴포넌트 (TypeScript)

```typescript
// 메인 캘린더 시스템
PersonalCalendar.tsx              # 다중 캘린더 시각화 (메인)
├── CalendarManagement.tsx        # 캘린더 CRUD 관리
├── EventCountIndicator.tsx       # 이벤트 개수 표시
└── ICSTooltip.tsx               # 20ms 응답속도 툴팁

// 일정 관리 페이지
pages/schedule/
├── ScheduleDashboard.tsx         # 메인 스케줄 대시보드
├── CreateEventPage.tsx          # 이벤트 생성
├── EventDetailPage.tsx          # 이벤트 상세
└── EventListPage.tsx            # 이벤트 목록

// 공통 컴포넌트
components/schedule/common/
├── EventCard.tsx                # 이벤트 카드
├── EventList.tsx               # 이벤트 리스트
└── LoadingSpinner.tsx          # 로딩 스피너
```

### Discord 봇 명령어 (완성)

```javascript
// bot/Commands/ 구조
일정갱신.js                      # /일정갱신 - 캐시 강제 갱신
내일정.js                        # /내일정 [months] - 일정 조회
일정체크.js                      # /일정체크 [dates] [months] - 교차 확인
```

## 📊 데이터 구조

### 주요 Entity/DTO

```java
// 백엔드 엔티티
CalendarEvent.java               # 일정 데이터 (제목, 시간, 소스)
UserCalendar.java               # 사용자 캘린더 (iCal URL, 색상, 이름)
BlockedDate.java                # 비트맵 날짜 차단 (90일→12바이트)
RecommendedTimeSlot.java        # AI 추천 시간대

// 프론트엔드 타입
types/calendar.ts
├── CalendarEvent                # 캘린더 이벤트 인터페이스
├── UserCalendar                # 사용자 캘린더 인터페이스
└── GroupedCalendarEventsResponse # 그룹화된 응답 타입
```

### 데이터베이스 테이블 (MariaDB)

```sql
events                          # 메인 이벤트 테이블
event_participants              # 참여자 테이블
user_calendars                  # 외부 캘린더 통합 (iCal)
user_blocked_periods            # 비트맵 날짜 차단 (12바이트 압축)
recommended_times               # AI 추천 시간
```

## 🛠️ 개발 환경 설정

### 빠른 시작 명령어

```bash
# 백엔드 (포트: 8080)
cd backend/backend && ./gradlew bootRun

# 프론트엔드 (포트: 5173)
cd frontend && npm run dev

# Discord 봇
cd bot && npm start

# 전체 시스템
docker-compose up -d
```

### 필수 개발 규칙

1. **API 클라이언트**: 프론트엔드는 `apiClient` 사용 필수
2. **Bearer Token**: Discord 봇은 `process.env.DISCORD_CLIENT_SECRET` 필수
3. **TypeScript**: 모든 타입 정의 필수
4. **Read First**: 파일 수정 전 Read 도구 사용

## 🎯 현재 완성된 기능 (v2.0)

### ✅ 완성

-   다중 캘린더 시각화 (Google/Apple/Outlook iCal 지원)
-   비트맵 날짜 관리 (99% 저장공간 절약)
-   Discord 봇 일정 명령어 (`/내일정`, `/일정체크`, `/일정갱신`)
-   Redis 다중 캐시 시스템 (30분 TTL, Bean 충돌 해결)
-   반응형 UI (20ms 툴팁, 완전 반응형)

### 🔄 진행 예정

-   이중 추천 시스템 UI
-   이벤트 상세 모달
-   통합 테스트 & 최적화

## 🔑 핵심 기술 스택

-   **백엔드**: Java 21, Spring Boot 3.4.3, MariaDB, Redis (다중 Template)
-   **프론트엔드**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
-   **Discord 봇**: Node.js, Discord.js v14, Sequelize, Redis Pub/Sub
-   **인증**: JWT (Web), Bearer Token (Bot), Discord OAuth2

백엔드 자바스프링은 intelij 로 직접 실행하고 있고 프론트도 사용자가 직접 실행중임, 인증 관련으로 인해 curl 로 테스트 해볼수 없음 코드 기반으로 테스트및 검증해야하고 사용자가 입력하는 로그를 기반으로 처리해야함

## 📊 데이터베이스 직접 접속

### MariaDB 컨테이너 접속 방법

```bash
# 데이터베이스 직접 접속 (root 권한)
docker exec cat_db mariadb -u root discord

# 특정 쿼리 실행 예시
docker exec cat_db mariadb -u root discord -e "SELECT HEX(id) as hex_id, display_name, last_synced_at, updated_at FROM user_calendars;"

# UUID를 HEX로 변환하여 조회
docker exec cat_db mariadb -u root discord -e "SELECT HEX(id) as hex_id, display_name, last_synced_at, updated_at FROM user_calendars WHERE display_name = '크씬1';"
```
