# Mystery Place Voice Chat 개발 진행 상황

## 📋 개발 진행 상황

### ✅ 완료된 작업

1. **프로젝트 구조 분석 완료**
   - 기존 프로젝트: React + TypeScript + Spring Boot + MariaDB
   - 채팅 기능 없음 확인 (완전히 새로 구현)
   - Makefile 기반 config 구조 파악

2. **Zustand 상태 관리 설정 완료**
   - 설치: `zustand` 패키지
   - 파일: `/frontend/src/store/useAppStore.ts`
   - 채팅, 음성, 관리자 기능 상태 통합 관리

3. **기본 데이터베이스 설계 및 마이그레이션 완료**
   - 파일: `/docker/mariadb/db/migrations/V1.4.0/V1.4.0_001_create_voice_chat_tables.sql`
   - 8개 테이블 생성: 채팅, 음성세션, 권한, 투표, 공지, 오디오파일 등

4. **Discord 스타일 서버-채널 아키텍처 구현 완료** ⭐️ **NEW**
   - **V1.4.1 마이그레이션**: `/docker/mariadb/db/migrations/V1.4.1/V1.4.1_001_create_server_channel_hierarchy.sql`
   - **서버 계층**: 비밀번호 보호, BCrypt 해싱, 서버 관리자(ADMIN) 시스템
   - **채널 계층**: 권한 기반 접근, 채널 모더레이터(MODERATOR) 시스템
   - **UUID BINARY(16)**: 기존 User 테이블과 일관성 있는 데이터타입 적용

5. **Spring Boot 도메인 엔티티 완성** ⭐️ **NEW**
   - **서버 관련**: `ChatServer.java`, `ServerMember.java`
   - **채널 관련**: `ServerChannel.java`, `ChannelMember.java`
   - **메시지 관련**: `ChatMessage.java` (서버-채널 구조로 업데이트)
   - **기타 도메인**: `VoiceSessionLog.java`, `Vote.java`, `VoteResponse.java`, `Announcement.java`, `AudioFile.java`

6. **Repository 인터페이스 완성** ⭐️ **NEW**
   - **ChatServerRepository**: 서버 관리, 멤버십 조회, 인기 서버 등
   - **ServerMemberRepository**: 서버 멤버 관리, 권한 확인, 활성 사용자 추적
   - **ServerChannelRepository**: 채널 관리, 타입별 조회, 채널 통계
   - **ChannelMemberRepository**: 채널 멤버 관리, 모더레이터 권한 관리
   - **ChatMessageRepository**: 서버-채널별 메시지 조회, 검색, 페이지네이션

7. **시그널 서버 기본 구조 완료**
   - Node.js + socket.io 기반 WebSocket 서버
   - JWT 인증 미들웨어 구현
   - 채팅, 음성, 관리자 이벤트 핸들러 기본 구조
   - Dockerfile 및 헬스체크 설정

8. **Docker 인프라 설정 완료 및 통합** ⭐️ **UPDATED**
   - **Docker Compose 통합**: voice-chat 전용 파일을 `docker-compose.dev.yaml`로 통합
   - **디렉토리 구조 정리**: `/signal-server` → `/docker/signal-server`로 이동
   - **서비스 추가**: Signal Server + TURN Server + Redis 확장
   - **볼륨 설정**: 오디오 업로드, 마이그레이션 경로 통합
   - **네트워크 설정**: 모든 voice chat 서비스들을 discord-network에 통합

9. **Redis 기반 비동기 버퍼링 + 배치 쓰기 시스템 구현 완료**
   - **MessageBufferService**: Redis List 기반 메시지 버퍼링
   - **배치 처리**: 5초마다 또는 50개 메시지 단위로 자동 처리
   - **실패 처리**: 재시도 로직 + 백업 큐 시스템
   - **Spring Boot API**: 배치 저장 엔드포인트 + 통계 조회
   - **관리자 기능**: 수동 플러시, 실패 재시도, 상태 조회

10. **서버-채널 커스텀 역할 시스템 구현 완료** ⭐️ **NEW**
   - **DB 확장**: ServerRole 테이블 + ServerMember 커스텀 역할/프로필 컬럼
   - **도메인 엔티티**: `ServerRole.java` (권한 시스템 + 색상 지원)
   - **Repository**: `ServerRoleRepository.java` (권한별 조회, 관리자 역할 등)
   - **Service Layer**: `ServerRoleService.java`, `ServerMemberService.java` (역할 CRUD + 권한 검증)
   - **REST API**: `ServerRoleController.java`, `ServerMemberController.java`
   - **DTO 시스템**: 역할 생성/수정, 멤버 프로필 업데이트 DTO

### 🚧 진행 중인 작업

- 현재 작업 없음 (주요 서버-채널 API 시스템 완료)

### 📝 다음 작업 예정

1. **기본 서버-채널 REST API 완성** ⭐️ **HIGH PRIORITY**
   - **ServerController**: 서버 생성, 비밀번호 검증, 입장/탈퇴
   - **ChannelController**: 채널 생성, 권한 기반 접근 제어
   - **ChannelMemberController**: 채널 멤버 관리, 모더레이터 권한

2. **에러 처리 및 검증 시스템 완성** ⭐️ **HIGH PRIORITY** 
   - **ErrorStatus 확장**: 새로운 에러 코드 추가
     - `ROLE_NAME_DUPLICATE`, `CANNOT_MODIFY_DEFAULT_ROLE`, `ROLE_NOT_FOUND`
     - `INVALID_ROLE`, `ROLE_IN_USE`, `MEMBER_NOT_FOUND`
     - `INSUFFICIENT_PERMISSION`, `INVALID_PERMISSION`
   - **Validation 어노테이션**: DTO 필드 검증 추가
   - **GlobalExceptionHandler**: 새로운 예외 처리 추가

3. **시그널 서버 서버-채널 구조 적용**
   - Room 구조 변경: `server:${serverId}:channel:${channelId}`
   - 서버 입장 시 역할 정보 로드 및 캐싱
   - 메시지 전파 시 서버별 프로필 오버라이드
   - 권한 기반 이벤트 차단 미들웨어
   - Redis 버퍼 키 구조: `chat:buffer:${serverId}:${channelId}`

4. **Zustand 스토어 서버-채널 구조 확장**
   - 서버 상태 관리: 서버 목록, 선택된 서버, 입장/탈퇴
   - 채널 상태 관리: 채널 목록, 선택된 채널, 권한 상태
   - 역할 상태 관리: 서버별 역할, 멤버 역할 할당
   - 메시지 상태: 서버-채널별 메시지 분리

5. **React UI 컴포넌트 구현**
   - **ServerSidebar**: 서버 목록, 서버 생성 모달 (비밀번호 입력)
   - **ChannelSidebar**: 채널 목록, 채널 생성 모달 (권한 기반)
   - **RoleManagementPanel**: 역할 생성/수정/삭제 UI
   - **MemberList**: 서버 멤버, 역할 배지, 서버별 프로필 표시
   - **ServerSettingsModal**: 서버 설정 + 역할 관리 탭

6. **권한 시스템 완성**
   - **REST API 미들웨어**: 엔드포인트별 권한 검증
   - **WebSocket 미들웨어**: 실시간 이벤트 권한 차단
   - **프론트엔드 권한 UI**: 역할별 조건부 렌더링

7. **통합 테스트 및 배포**
   - 서버-채널 구조 전체 테스트
   - 커스텀 역할 시스템 검증
   - 서버별 프로필 오버라이드 테스트

---

## 🏗️ 프로젝트 아키텍처

### 기술 스택
- **프론트엔드**: React 18 + TypeScript + Vite + TailwindCSS
- **백엔드**: Java 17 + Spring Boot 3.x + JWT + MariaDB 10.9
- **시그널 서버**: Node.js + socket.io (별도 서버)
- **상태 관리**: Zustand
- **실시간 통신**: WebSocket (socket.io) + WebRTC
- **TURN 서버**: Coturn (Docker)
- **인증**: Discord OAuth2 + JWT

### 서비스 구성 (Discord 스타일 서버-채널 구조)
```
frontend (React) ←→ backend (Spring Boot) ←→ MariaDB
      ↓                      ↓
signal-server (Node.js) ←→ Redis (메시지 버퍼링)
      ↓
TURN Server (Coturn) + WebRTC

서버 구조:
Server 1 (비밀번호 보호)
├── Channel A (텍스트)
├── Channel B (음성)
└── Channel C (텍스트+음성)

Server 2 (비밀번호 보호)
├── Channel X
└── Channel Y
```

---

## 📁 중요한 파일 경로

### 프론트엔드 (/frontend)
```
src/
├── store/useAppStore.ts           # Zustand 전역 상태 관리
├── lib/api.ts                     # API 클라이언트 (기존)
├── api/auth/authService.ts        # 인증 서비스 (기존)
├── components/                    # React 컴포넌트 (예정)
│   ├── ChatInput.tsx
│   ├── ChatList.tsx
│   ├── VoiceArea.tsx
│   └── AdminPanel.tsx
└── hooks/                         # 커스텀 훅 (예정)
    ├── useWebSocket.ts
    └── useWebRTC.ts
```

### 백엔드 (/backend/backend)
```
src/main/java/com/crimecat/backend/
├── chat/                          # 채팅 관련 패키지
│   ├── domain/                    # 엔티티 클래스
│   │   ├── ChatServer.java        ✅ 완료 (서버 엔티티)
│   │   ├── ServerMember.java      ✅ 완료 (서버 멤버)
│   │   ├── ServerChannel.java     ✅ 완료 (채널 엔티티)
│   │   ├── ChannelMember.java     ✅ 완료 (채널 멤버)
│   │   ├── ChatMessage.java       ✅ 완료 (서버-채널 구조)
│   │   ├── VoiceSessionLog.java   ✅ 완료
│   │   ├── Vote.java              ✅ 완료
│   │   ├── VoteResponse.java      ✅ 완료
│   │   ├── Announcement.java      📝 예정
│   │   └── AudioFile.java         📝 예정
│   ├── repository/                ✅ 완료 (5개 Repository)
│   │   ├── ChatServerRepository.java      ✅ 완료
│   │   ├── ServerMemberRepository.java    ✅ 완료
│   │   ├── ServerChannelRepository.java   ✅ 완료
│   │   ├── ChannelMemberRepository.java   ✅ 완료
│   │   └── ChatMessageRepository.java     ✅ 완료
│   ├── service/                   ✅ 완료 (역할 시스템)
│   │   ├── ServerRoleService.java         ✅ 완료
│   │   └── ServerMemberService.java       ✅ 완료
│   ├── controller/                ✅ 완료 (역할 시스템)
│   │   ├── ServerRoleController.java      ✅ 완료
│   │   └── ServerMemberController.java    ✅ 완료
│   └── dto/                       ✅ 완료 (역할 시스템)
│       ├── ServerRoleDto.java             ✅ 완료
│       └── ServerMemberDto.java           ✅ 완료
└── config/SecurityConfig.java     # 보안 설정 (기존, 수정 예정)
```

### 데이터베이스 마이그레이션
```
/docker/mariadb/db/migrations/
├── V1.4.0/
│   └── V1.4.0_001_create_voice_chat_tables.sql      ✅ 완료 (기본 테이블)
└── V1.4.1/
    └── V1.4.1_001_create_server_channel_hierarchy.sql  ✅ 완료 (서버-채널 구조)
```

### 시그널 서버 (/docker/signal-server)
```
/docker/signal-server/
├── index.js                       ✅ 완료 (메인 서버 파일)
├── Dockerfile                     ✅ 완료
├── package.json                   ✅ 완료 (의존성 설정)
└── services/                      ✅ 완료 (서비스 레이어)
    └── MessageBufferService.js    ✅ 완료 (Redis 버퍼링)
```

---

## 🔧 주요 SDK 및 라이브러리

### 프론트엔드 의존성
```json
{
  "dependencies": {
    "react": "^18.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "zustand": "^4.x",           // ✅ 새로 추가
    "axios": "^1.x",             // 기존 (API 통신)
    "socket.io-client": "^4.x",  // 📝 추가 예정
    "emoji-picker-react": "^4.x", // 📝 추가 예정
    "react-emoji-render": "^2.x"  // 📝 추가 예정
  }
}
```

### 백엔드 의존성 (기존 + 추가 예정)
```gradle
dependencies {
    // 기존 Spring Boot 의존성들
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // 기존 JWT 및 OAuth2
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
    
    // 기존 데이터베이스
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.mariadb.jdbc:mariadb-java-client'
    
    // JSON 처리 (기존)
    implementation 'com.fasterxml.jackson.core:jackson-databind'
    
    // 파일 업로드 (음성 파일용, 추가 예정)
    implementation 'org.springframework.boot:spring-boot-starter-web' // multipart 지원
}
```

### 시그널 서버 의존성 (예정)
```json
{
  "dependencies": {
    "socket.io": "^4.x",
    "jsonwebtoken": "^9.x",
    "cookie-parser": "^1.x",
    "cors": "^2.x",
    "express": "^4.x",
    "axios": "^1.x"
  }
}
```

---

## 🔑 주요 로직 위치

### 1. 인증 시스템 (기존 활용)
- **JWT 생성/검증**: `/backend/src/.../auth/jwt/JwtTokenProvider.java`
- **OAuth2 처리**: `/backend/src/.../auth/service/DiscordOAuth2UserService.java`
- **프론트 인증**: `/frontend/src/api/auth/authService.ts`

### 2. API 통신 (기존 활용)
- **HTTP 클라이언트**: `/frontend/src/lib/api.ts`
- **인터셉터**: JWT 자동 갱신, CSRF 토큰 처리
- **에러 핸들링**: 401/403 재시도 로직

### 3. 상태 관리 (새로 구현)
- **전역 상태**: `/frontend/src/store/useAppStore.ts`
- **채팅 상태**: messages, isConnected
- **음성 상태**: voiceUsers, isVoiceConnected, voiceEffect
- **관리자 상태**: votes, announcements, audioFiles

### 4. 데이터베이스 스키마 (서버-채널 구조)
- **서버**: chat_servers (id, name, password_hash, created_by, max_members)
- **서버 멤버**: server_members (server_id, user_id, role[MEMBER/ADMIN])
- **채널**: server_channels (id, server_id, name, channel_type[TEXT/VOICE/BOTH])
- **채널 멤버**: channel_members (channel_id, user_id, role[MEMBER/MODERATOR])
- **채팅**: chat_messages (id, server_id, channel_id, user_id, content, message_type)
- **음성**: voice_session_logs (user_id, server_id, channel_id, start_time, end_time)
- **투표**: votes + vote_responses (server_id, channel_id, question, options)
- **관리**: announcements, audio_files (server_id, channel_id 포함)

---

## 🎯 다음 단계 우선순위 (서버-채널 구조 기준)

1. **HIGH**: 서버-채널 REST API 완성 (Service, Controller, DTO)
2. **HIGH**: 시그널 서버 서버-채널 구조 적용 
3. **MEDIUM**: Zustand 스토어 서버-채널 상태 관리 확장
4. **MEDIUM**: React Discord 스타일 UI 컴포넌트 구현
5. **LOW**: WebRTC 음성 채팅 + 채널별 분리
6. **LOW**: 관리자 기능 + 권한 시스템 완성

---

## 📊 예상 개발 일정 (업데이트)

- **1단계** (1-2일): 서버-채널 REST API 완성 (Service + Controller)
- **2단계** (1-2일): 시그널 서버 + 프론트엔드 상태 관리 업데이트  
- **3단계** (2-3일): Discord 스타일 UI + 기본 채팅 기능
- **4단계** (2-3일): 음성 채팅 + WebRTC + 채널별 분리
- **5단계** (1-2일): 권한 시스템 + 관리자 기능 완성
- **6단계** (1일): 전체 테스트 + Docker 배포 설정

**총 예상 기간**: 8-13일

---

## 🚀 주요 개선 사항

### ✨ Discord 스타일 아키텍처 도입
- **서버 계층**: 비밀번호로 보호되는 독립적인 커뮤니티 공간
- **채널 계층**: 서버 내 주제별/기능별 대화방 (텍스트/음성/혼합)
- **권한 시스템**: 서버 관리자 → 채널 모더레이터 계층적 권한 관리

### 🔒 보안 강화
- **BCrypt 해싱**: 서버 비밀번호 안전한 저장
- **권한 기반 접근**: 채널별 세밀한 접근 제어
- **UUID BINARY(16)**: 데이터베이스 일관성 및 성능 최적화

### ⚡ 성능 최적화
- **복합 인덱스**: 서버-채널별 메시지 조회 최적화
- **Redis 키 분리**: `chat:buffer:${serverId}:${channelId}` 구조
- **페이지네이션**: 무한 스크롤 및 히스토리 로딩 지원