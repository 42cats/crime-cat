# 서비스 간 API 계약서

## 🔌 서비스 간 통신 구조

### 인증 체계
```
Frontend ──JWT──> Backend API
Discord Bot ──Bearer Token──> Backend API (/bot/v1/**)
Backend ──Redis Pub/Sub──> Discord Bot
```

## 🚀 주요 API 엔드포인트

### 1. 캘린더 관리 API
**기본 URL**: `/api/v1/calendars`

```typescript
// 그룹화된 이벤트 조회
GET /calendars/events/grouped?start=2024-01-01&end=2024-01-31
Response: {
  "calendar-1": {
    "calendarId": "calendar-1",
    "displayName": "Google Calendar", 
    "colorHex": "#ef4444",
    "events": [CalendarEvent[]]
  }
}

// 사용자 캘린더 목록
GET /calendars
Response: UserCalendar[]

// 캘린더 생성/수정/삭제
POST /calendars
PUT /calendars/{id}
DELETE /calendars/{id}
```

### 2. Discord 봇 전용 API
**기본 URL**: `/bot/v1/schedule`
**인증**: `Bearer ${process.env.DISCORD_CLIENT_SECRET}`

```typescript
// 내일정 조회
GET /user/{discordSnowflake}/my-schedule?months=3
Response: {
  "discordSnowflake": "123456789012345678",
  "koreanDateFormat": "8월 28 29 30, 9월 3 4 7 10",
  "totalEvents": 25,
  "requestedMonths": 3,
  "calendarCount": 2,
  "syncedAt": "2025-08-28T10:30:00",
  "isWebUserRegistered": true,
  "hasICalCalendars": true
}

// 일정 교차 체크
POST /user/{discordSnowflake}/check-overlap
Body: {
  "inputDates": "10월 1 2 3 4",
  "months": 3
}
Response: {
  "discordSnowflake": "123456789012345678",
  "inputDates": "10월 1 2 3 4", 
  "overlappingDates": "10월 2 4",
  "inputTotal": 4,
  "totalMatches": 2,
  "userTotal": 25,
  "matchPercentage": 50.0,
  "requestedMonths": 3,
  "checkedAt": "2025-08-28T10:30:00"
}

// 캐시 강제 갱신
POST /user/{discordSnowflake}/refresh-cache
Response: "일정 캐시가 성공적으로 갱신되었습니다."
```

### 3. 일정 관리 API
**기본 URL**: `/api/v1/events`

```typescript
// 이벤트 생성
POST /events
Body: {
  "title": "팀 미팅",
  "description": "프로젝트 진행 상황 논의",
  "startTime": "2024-01-15T14:00:00",
  "endTime": "2024-01-15T16:00:00",
  "maxParticipants": 10,
  "isSecret": false
}

// 이벤트 참여/취소
POST /events/{eventId}/participate
DELETE /events/{eventId}/participate
```

## 🔐 인증 시스템

### Frontend → Backend
```typescript
// JWT 토큰 자동 처리 (apiClient)
export const calendarService = {
  getEvents: () => apiClient.get<CalendarEvent[]>("/calendars/events"),
  // JWT는 apiClient에서 자동 처리
};
```

### Discord Bot → Backend
```javascript
// Bearer 토큰 인증
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.DISCORD_CLIENT_SECRET}`,
  },
};

const response = await axios.post(
  `${API_BASE_URL}/bot/v1/schedule/user/${discordSnowflake}/my-schedule`,
  data,
  config
);
```

## 📡 실시간 통신 (Redis Pub/Sub)

### 채널 구조
```javascript
// 백엔드 → Discord 봇 실시간 알림
"user-updates"     // 사용자 데이터 변경
"game-events"      // 게임 이벤트 발생  
"notifications"    // 시스템 알림
"advertisement"    // 광고 시스템 이벤트
```

### 메시지 포맷
```json
{
  "type": "USER_SCHEDULE_UPDATE",
  "userId": "discord-snowflake-id",
  "data": {
    "action": "CALENDAR_ADDED",
    "calendarName": "Google Calendar",
    "timestamp": "2025-08-28T10:30:00"
  }
}
```

## 🔄 데이터 플로우

### 일정 조회 플로우
```
1. Discord: /내일정 3
2. Bot → Backend: GET /bot/v1/schedule/user/{id}/my-schedule?months=3
3. Backend: Redis 캐시 확인 → iCal 파싱 (필요시) → 한국어 변환
4. Backend → Bot: MyScheduleResponse
5. Bot → Discord: 임베드 메시지 전송
```

### 캘린더 동기화 플로우  
```
1. Frontend: 사용자가 iCal URL 입력
2. Frontend → Backend: POST /calendars (JWT 인증)
3. Backend: DB 저장 + 캐시 갱신
4. Backend → Redis: Pub/Sub 이벤트 발행
5. Discord Bot: 실시간 알림 수신
```

## 📋 에러 코드

### 공통 에러 코드
```typescript
// HTTP 상태 코드 + 커스텀 에러 코드
{
  "status": 400,
  "error": "INVALID_DATE_FORMAT", 
  "message": "날짜 형식이 올바르지 않습니다",
  "timestamp": "2025-08-28T10:30:00"
}
```

### Discord 봇 전용 에러
```typescript
DISCORD_USER_NOT_LINKED     // Discord 계정 미연동
WEB_USER_NOT_REGISTERED     // 웹사이트 미가입
CALENDAR_NOT_REGISTERED     // iCal 캘린더 미등록  
INVALID_DISCORD_SNOWFLAKE   // 잘못된 Discord ID
ICAL_PARSING_FAILED        // iCal 파싱 실패
CACHE_REFRESH_FAILED       // 캐시 갱신 실패
```

## 🔗 관련 문서
- [백엔드 API 상세](../backend/api/rest-controllers.md)
- [프론트엔드 API 통합](../frontend/api-integration/api-client.md)  
- [Discord 봇 API 연동](../discord-bot/api-integration/backend-api.md)
- [프로젝트 개요](project-overview.md)