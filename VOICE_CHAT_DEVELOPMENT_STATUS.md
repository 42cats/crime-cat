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

11. **로컬 개발환경 Voice Chat 시스템 구축 완료** ⭐️ **NEW**
   - **Docker Compose 로컬 설정**: `docker-compose.local.yaml`에 Signal Server + TURN Server 추가
   - **Vite 프록시 설정**: WebSocket 연결을 위한 Signal Server 프록시 구성
   - **Nginx 로컬 설정**: WebSocket 업그레이드 및 프록시 패스 설정
   - **Spring Boot 로컬 설정**: Voice Chat 관련 환경변수 및 설정 추가
   - **Docker 이미지 분리**: Signal Server (경량, opus 제외) + Discord Bot (opus 포함)
   - **의존성 충돌 해결**: @discordjs/opus 네이티브 모듈 컴파일 문제 해결
   - **Spring Security 수정**: PasswordEncoder 빈 추가 (ServerService 의존성 해결)

12. **프론트엔드 WebSocket 클라이언트 시스템 완성** ⭐️ **NEW**
   - **WebSocket 서비스**: `/frontend/src/services/websocketService.ts` (싱글톤 연결 관리)
   - **React 훅 시스템**: 4개 커스텀 훅 구현
     - `useWebSocket`: 연결 상태 관리 및 재연결 로직
     - `useServerChannel`: 서버/채널 입장/탈퇴 관리
     - `useChat`: 메시지 송수신 및 타이핑 인디케이터
     - `useVoiceChat`: 음성 채팅 및 WebRTC 연결 관리
   - **Zustand 스토어 확장**: 서버-채널 구조 지원
     - 채널별 메시지 분리 저장 (`messagesByChannel`)
     - 서버/채널 상태 관리 (`currentServer`, `currentChannel`)
     - 음성 사용자 관리 및 WebRTC 상태 추적
   - **WebRTC P2P 연결**: 음성 채팅을 위한 피어 연결 관리
   - **이벤트 기반 아키텍처**: 실시간 이벤트 처리 및 React 컴포넌트 연동 준비

13. **채팅 도메인 UUID BINARY(16) 변환 완료** ⭐️ **COMPLETED**
   - **V1.4.3 마이그레이션**: 모든 채팅 관련 테이블을 UUID BINARY(16)로 변환
     - 기존 BIGINT PRIMARY KEY → UUID BINARY(16) 형식으로 완전 변환
     - Character.java 패턴 따라 `@UuidGenerator` + `@JdbcTypeCode(SqlTypes.BINARY)` 적용
     - 기존 데이터 삭제 후 새로운 UUID 구조로 재생성
   - **도메인 엔티티 업데이트**: 11개 채팅 관련 엔티티 모두 UUID 변환
     - `ChatServer`, `ServerMember`, `ServerRole`, `ServerChannel`, `ChannelMember`
     - `ChatMessage`, `VoiceSessionLog`, `Vote`, `VoteResponse`, `Announcement`, `AudioFile`
   - **Repository 인터페이스**: `JpaRepository<Entity, UUID>` 형식으로 일관성 있게 변경
   - **Service 메소드**: 모든 파라미터 Long → UUID 변환 (ChatMessageService 등)
   - **Controller PathVariable**: 모든 컨트롤러 @PathVariable UUID 타입으로 변경
   - **DTO 클래스**: 모든 ID 필드 Long → UUID 타입 변경
   - **빌드 성공**: Gradle 컴파일 오류 없이 성공적으로 완료

14. **전체 시스템 통합 및 문제 해결 완룼** ⭐️ **NEW**
   - **인증 문제 해결**: @PreAuthorize 어노테이션을 AuthenticationUtil로 완전 대체
   - **컴파일 오류 수정**: Repository 인터페이스의 모든 Long → UUID 매개변수 변환
   - **프론트엔드 서버 연결**: "잘못된 서버 ID입니다" 오류 해결
   - **서버 멤버십 로직**: "이미 서버의 멤버입니다" 오류를 정상 동작으로 수정
   - **하드코딩된 데이터 제거**: 모든 React 컴포넌트에서 실제 API 연동으로 대체
   - **메시지 전송 수정**: 채널별 단순한 배열 저장에서 서버-채널 구조로 변경
   - **사용자명 수정**: "Unknown" 표시 문제를 effectiveDisplayName 필드로 해결
   - **음성 채널 수정**: 400 오류를 VoiceSession API 엔드포인트 추가로 해결
   - **TypeScript 타입 수정**: 모든 number → string (UUID) 타입 변환 완료

15. **생산 환경 인증 시스템 구축 완료** ⭐️ **NEW**
   - **Signal Server 인증 강화**: 모든 development-mode 로직 제거
     - JWT 토큰 필수 검증: development-mode 토큰 허용 중단
     - 사용자 인증 바이패스 제거: 모든 연결에 대해 백엔드 API 검증 필수
     - 채널 멤버십 검증: 개발 모드 스킵 로직 제거
   - **프론트엔드 WebSocket**: development 플래그 및 임시 토큰 제거
   - **인증 플로우**: 모든 WebSocket 연결에 대해 적절한 JWT 토큰 필수
   - **생산 준비**: 모든 인증 단계에서 우회 및 개발 모드 로직 완전 제거

16. **Signal Server 전용 인증 체계 구축 완료** ⭐️ **NEW**
   - **환경변수 설정**: `SIGNAL_SERVER_SECRET_TOKEN` YAML 설정 통합
   - **Backend URL 환경별 분리**: 로컬/개발/운영 환경별 올바른 URL 설정
   - **SignalServerTokenFilter 개선**: YAML 설정에서 토큰 읽기
   - **이중 인증 체계 준비**: 사용자 JWT + Signal Server 전용 토큰

17. **Signal Server와 Backend API 분리 및 인증 통합 완료** ⭐️ **CRITICAL FIX**
   - **API 엔드포인트 분리**: Signal Server 전용 API (`/api/v1/signal/`) vs 웹 클라이언트 API (`/api/v1/servers/`)
   - **SignalServerAuthUtil 헬퍼 클래스**: X-User-ID, X-User-Token 헤더 기반 사용자 인증 추출
   - **JWT 인증 필터 수정**: `/api/v1/signal/` 경로를 JWT 처리에서 제외하고 SignalServerTokenFilter로 처리
   - **Signal Server 컨트롤러 완전 분리**: 
     - `ServerController` → Signal Server 전용 (`/api/v1/signal/servers/`)
     - `ServerMemberController` → Signal Server 전용 (`/api/v1/signal/servers/{serverId}/members/`)
     - `ChannelController` → Signal Server 전용 (`/api/v1/signal/servers/{serverId}/channels/`)
     - `ChatMessageController` → Signal Server 전용 (`/api/v1/signal/servers/{serverId}/channels/{channelId}/messages/`)
   - **웹 클라이언트 전용 컨트롤러 생성**: 
     - `WebServerController` → 웹 클라이언트용 (`/api/v1/servers/`)
     - `WebServerMemberController`, `WebChannelController`, `WebChatMessageController`
   - **서비스 레이어 통합**: WebUser ID ↔ User ID 매핑 로직으로 양쪽 인증 체계 지원
   - **MessageBufferService 배치 저장 수정**: 웹 클라이언트 API → Signal Server API로 변경하여 403 오류 해결
   - **Bearer 토큰 인증**: Signal Server의 모든 백엔드 API 호출에 `SIGNAL_SERVER_SECRET_TOKEN` 사용

17. **음성 채팅 WebRTC 연결 및 오류 수정 완료** ⭐️ **VOICE CHAT FIX**
   - **React Hook 초기화 에러 해결**: `useVoiceChat.ts`에서 함수 정의 순서 문제 수정
     - `initiateWebRTCConnection` 함수를 `handleVoiceJoined` 콜백보다 먼저 정의
     - "Cannot access before initialization" 에러 완전 해결
   - **TURN 서버 401 Unauthorized 에러 해결**: 
     - **환경변수 동기화**: `.env.local`에 `VITE_TURN_*` 환경변수 추가
     - **동적 TURN 인증**: 시간 기반 credential 생성 함수 구현 (HMAC-SHA1 + Base64)
     - **인증 방식 통일**: Docker Compose `--use-auth-secret` + 클라이언트 동적 인증
     - **WebRTC 설정 업데이트**: `getRTCConfiguration()` 비동기 함수로 변경
   - **Signal Server 음성 채널 개선**:
     - 음성 채널 입장 시 기존 사용자 목록 자동 전송
     - 자동 채널 멤버십 생성 (403 에러 방지)
     - WebRTC 피어 연결 시작 시그널링 개선
   - **프론트엔드 오류 수정**:
     - `voiceUsers.map is not a function` 에러 → `Array.isArray()` 체크 추가
     - Missing export 에러 → `webrtc.ts`에 누락된 함수 export 추가

18. **Cloudflare SFU 아키텍처 완전 전환 진행 중** ⭐️ **SFU MIGRATION IN PROGRESS**
   - **P2P → SFU 전환**: 무제한 사용자 지원을 위한 아키텍처 변경
     - P2P WebRTC 시그널링 완전 제거 (voice:offer, voice:answer, voice:ice-candidate)
     - SFU 트랙 관리 이벤트로 대체 (sfu:track:publish, sfu:track:subscribe, sfu:track:unpublish)
   - **Signal Server SFU 통합**:
     - Cloudflare Realtime SFU 세션 자동 생성/관리
     - WebSocket 기반 SFU 트랙 발행/구독 시스템
     - 사용자 퇴장 시 자동 SFU 트랙 정리
   - **Frontend SFU 클라이언트**:
     - websocketService: SFU 이벤트 핸들러 및 WebSocket 통신
     - SFUService: HTTP API → WebSocket 이벤트 기반으로 전환
     - useVoiceChatSFU: 자동 트랙 구독 및 실시간 스트림 관리
   - **확장성 개선**: P2P 4-6명 제한 → 무제한 사용자 지원
   - **성능 최적화**: 중앙화된 미디어 라우팅으로 대역폭 효율성 향상

19. **Cloudflare Realtime API 문제점 발견 및 수정 계획** ⭐️ **API ANALYSIS COMPLETE**
   - **API 엔드포인트 오류 발견**:
     - 잘못된 세션 생성 URL: `/sessions/new` → `/apps/{appId}/sessions/new`
     - 405 에러 원인: WHIP/WHEP 대신 Cloudflare 자체 Realtime API 사용 필요
   - **TURN 자격증명 생성 방식 오류**:
     - WebSocket URL로 HTTP 요청 시도 (`ws://` → `http://`)
     - Cloudflare TURN API 직접 호출 방식으로 변경 필요
   - **백엔드 채널 멤버십 중복 오류**:
     - Signal Server 채널 입장 시 예외 발생 대신 정상 처리 필요
   - **단계적 수정 계획 수립**:
     - Phase 1: 즉시 수정 (30분) - API 엔드포인트, TURN URL, 멤버십 오류
     - Phase 2: SFU 구현 (2시간) - 세션/트랙 관리, WebRTC 이벤트 처리
     - Phase 3: 최적화 (1시간) - 무제한 사용자 지원, 성능 튜닝

20. **Cloudflare Realtime API Phase 1-1 완료** ⭐️ **API ENDPOINTS FIXED**
   - **CloudflareService.js API 엔드포인트 수정 완료**:
     - createRealtimeSession: `/sessions/new` → `/apps/${appId}/sessions/new`
     - addTrackToSession: `/sessions/${sessionId}/tracks/new` → `/apps/${appId}/sessions/${sessionId}/tracks/new`
     - subscribeToTrack: `/sessions/${sessionId}/tracks/${trackId}/subscribe` → `/apps/${appId}/sessions/${sessionId}/tracks/new`
     - renegotiateSession: `/sessions/${sessionId}/renegotiate` → `/apps/${appId}/sessions/${sessionId}/renegotiate`
     - closeTrack: `/sessions/${sessionId}/tracks/close` → `/apps/${appId}/sessions/${sessionId}/tracks/close`
   - **트랙 데이터 구조 수정**: `sessionDescription` → `tracks: [{ location, sessionDescription }]`
   - **405 "reserved for future WHIP/WHEP" 오류 해결 준비 완료**

### 🚧 진행 중인 작업

1. **Cloudflare Realtime API 수정 및 SFU 완성** ⭐️ **진행 중 - Phase 1-2**
   - **Phase 1-1 ✅ 완료**: CloudflareService.js API 엔드포인트 모든 메서드 수정 완료
   - **Phase 1-2 (진행 예정)**:
     - webrtc.ts TURN URL 스키마 수정 (ws:// → http://)  
     - Signal Server TURN 자격증명 엔드포인트 구현
     - 백엔드 채널 멤버십 중복 오류 수정
   - **Phase 2 (SFU 구현 - 2시간)**:
     - Session 생성 플로우 정확한 구현
     - 트랙 발행/구독 로직 구현  
     - WebRTC 이벤트 처리 SFU 방식으로 변경
   - **Phase 3 (최적화 - 1시간)**:
     - 무제한 사용자 지원 구현 및 테스트
     - 성능 최적화 및 에러 처리 강화

### ✅ 최근 완료된 주요 작업

**21. Cloudflare Realtime SFU 통합 문제 수정** ⭐️ **SFU INTEGRATION FIXES**
   - **자동 종료 문제 해결**: 
     - useEffect cleanup 로직 정밀화 - 빈 dependency 배열 사용
     - 컴포넌트 언마운트 시에만 정리 작업 수행
     - leaveVoiceChannel 함수 호출 대신 직접 cleanup 구현
   - **사이드바 참여자 표시 수정**:
     - voice:join:success 이벤트에서 setVoiceUsers 호출 추가
     - voice:user-joined 이벤트에서 새 사용자를 voiceUsers 배열에 추가
     - WebSocket 이벤트 리스너 등록 및 cleanup 처리
   - **원격 오디오 수신 구현**:
     - RemoteAudioPlayer 컴포넌트 생성 - HTML audio 요소로 원격 스트림 재생
     - ChatLayout에 RemoteAudioPlayer 컴포넌트 추가
     - trackId 기반 오디오 요소 관리 및 자동 재생
   - **WebSocket 이벤트 처리 강화**:
     - joinVoiceChannel 메서드에 trackId 매개변수 추가
     - Signal Server index.js에서 trackId 전달 및 저장
     - VoiceStateManager에 trackId 필드 추가하여 SFU 트랙 관리
     - voice:user-joined 이벤트에 trackId 포함하여 브로드캐스트

### ✅ 최근 완료된 주요 작업

2. **React UI 컴포넌트 최종 다듬기** ⭐️ **98% 완료**
   - **기본 컴포넌트**: ServerSidebar, ChannelSidebar, ChatArea, MemberList 구현 완료
   - **API 통합**: 모든 컴포넌트에서 실제 백엔드 API 사용
   - **WebSocket 연동**: 실시간 메시지 송수신 완료
   - **사용자 인터페이스**: Discord 스타일 UI 및 UX 구현
   - **인증 문제 해결**: Signal Server ↔ Backend 인증 통합 완료
   - **음성 채팅 UI**: VoiceArea 컴포넌트 및 사용자 카드 완료

3. **성능 최적화 및 안정성 개선** ⭐️ **98% 완료**
   - **메시지 로딩**: 무한 스크롤 및 페이지네이션 최적화
   - **네트워크**: WebSocket 연결 안정성 및 재연결 로직
   - **에러 처리**: 사용자 친화적 오류 메시지 및 대체 동작
   - **배치 메시지 저장**: Redis 버퍼링 및 403 오류 해결 완료
   - **TURN 서버**: 동적 인증 및 NAT 환경 P2P 연결 최적화

### 📝 다음 작업 예정

1. **UI/UX 최종 완성** ⭐️ **MEDIUM PRIORITY**
   - **디자인 세부 조정**: Discord 스타일 컴포넌트 최종 다듬기
   - **반응형 디자인**: 모바일 및 태블릿 지원
   - **접근성**: 키보드 내비게이션 및 스크린 리더 지원
   - **성능 최적화**: 레이지 로딩 및 컴포넌트 매모이제이션

2. **고급 기능 구현** ⭐️ **LOW PRIORITY**
   - **WebRTC 음성 채팅**: P2P 연결 및 음성 품질 최적화
   - **화면 공유**: 비디오 스트리밍 및 WebRTC 화면 공유
   - **파일 업로드**: 이미지, 음성, 비디오 파일 공유
   - **메시지 검색**: 전체 텍스트 검색 및 필터링

3. **관리자 도구 고도화** ⭐️ **MEDIUM PRIORITY**
   - **서버 대시보드**: 사용자 통계, 메시지 통계, 서버 활동 로그
   - **역할 관리 고도화**: 세밀한 권한 설정 및 빌크 작업
   - **모더레이션 도구**: 메시지 삭제, 사용자 차단, 경고 시스템
   - **자동화 규칙**: 스팸 필터, 자동 모더레이션, 컨텐츠 띠

4. **성능 모니터링 및 최적화** ⭐️ **HIGH PRIORITY**
   - **메트릭 수집**: 사용자 활동, 서버 성능, WebSocket 연결 상태
   - **로그 시스템**: 구조화된 로깅 및 경고 시스템
   - **철체 벤치마크**: 대용량 동시 접속 및 메시지 처리 성능 테스트
   - **자동 스케일링**: Docker Swarm 또는 Kubernetes 기반 오토스케일링

5. **보안 강화** ⭐️ **HIGH PRIORITY**
   - **비루 차단**: 연속 메시지 전송, IP 기반 레이트 리미트
   - **컨텐츠 필터링**: 예의없는 언어, 스팸 링크, 악성 코드 차단
   - **암호화 강화**: 메시지 암호화, 민감 데이터 보호
   - **에러 보고**: 사용자 신고 시스템, 관리자 알림

6. **통합 테스트 및 배포 준비** ⭐️ **MEDIUM PRIORITY**
   - **자동화된 테스트**: E2E 테스트, API 테스트, WebSocket 테스트
   - **CI/CD 파이프라인**: GitHub Actions 및 자동 배포
   - **운영 환경**: 로드 밸런서, 백업, 모니터링 시스템
   - **데이터베이스 최적화**: 인덱스 튜닝, 쿼리 최적화, 커넥션 풀링

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
├── store/useAppStore.ts           # Zustand 전역 상태 관리 ✅ 완료 (서버-채널 구조)
├── services/                      # 서비스 레이어
│   └── websocketService.ts        ✅ 완료 (WebSocket 싱글톤)
├── hooks/                         # 커스텀 훅 ✅ 완료
│   ├── useWebSocket.ts            ✅ 완료 (연결 관리)
│   ├── useServerChannel.ts        ✅ 완료 (서버/채널 관리)
│   ├── useChat.ts                 ✅ 완료 (메시지 송수신)
│   └── useVoiceChat.ts            ✅ 완료 (WebRTC 음성)
├── lib/api.ts                     # API 클라이언트 (기존)
├── api/auth/authService.ts        # 인증 서비스 (기존)
└── components/                    # React 컴포넌트 (예정)
    ├── ServerSidebar.tsx          📝 예정
    ├── ChannelSidebar.tsx         📝 예정
    ├── ChatArea.tsx               📝 예정
    ├── ChatInput.tsx              📝 예정
    ├── VoiceArea.tsx              📝 예정
    └── MemberList.tsx             📝 예정
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
│   │   ├── Announcement.java      ✅ 완료
│   │   └── AudioFile.java         ✅ 완료
│   ├── repository/                ✅ 완료 (5개 Repository)
│   │   ├── ChatServerRepository.java      ✅ 완료
│   │   ├── ServerMemberRepository.java    ✅ 완료
│   │   ├── ServerChannelRepository.java   ✅ 완료
│   │   ├── ChannelMemberRepository.java   ✅ 완료
│   │   └── ChatMessageRepository.java     ✅ 완료
│   ├── service/                   ✅ 완료 (통합 서비스)
│   │   ├── ServerRoleService.java         ✅ 완료
│   │   ├── ServerMemberService.java       ✅ 완료
│   │   ├── ChannelService.java            ✅ 완료
│   │   ├── ChannelMemberService.java      ✅ 완료
│   │   └── ChatMessageService.java        ✅ 완료
│   ├── controller/                ✅ 완료 (API 분리)
│   │   ├── [Signal Server APIs]
│   │   │   ├── ServerController.java              ✅ 완료 (/api/v1/signal/servers/)
│   │   │   ├── ServerMemberController.java        ✅ 완료 (/api/v1/signal/servers/{serverId}/members/)
│   │   │   ├── ChannelController.java             ✅ 완료 (/api/v1/signal/servers/{serverId}/channels/)
│   │   │   └── ChatMessageController.java         ✅ 완료 (/api/v1/signal/servers/{serverId}/channels/{channelId}/messages/)
│   │   └── [Web Client APIs]
│   │       ├── WebServerController.java           ✅ 완료 (/api/v1/servers/)
│   │       ├── WebServerMemberController.java     ✅ 완료 (/api/v1/servers/{serverId}/members/)
│   │       ├── WebChannelController.java          ✅ 완료 (/api/v1/servers/{serverId}/channels/)
│   │       └── WebChatMessageController.java      ✅ 완료 (/api/v1/servers/{serverId}/channels/{channelId}/messages/)
│   └── dto/                       ✅ 완료 (통합 DTO)
│       ├── ServerRoleDto.java             ✅ 완료
│       ├── ServerMemberDto.java           ✅ 완료
│       ├── ChannelDto.java                ✅ 완료
│       ├── ChannelMemberDto.java          ✅ 완료
│       └── ChatMessageDto.java            ✅ 완료
├── utils/                         ✅ 완료 (인증 헬퍼)
│   └── SignalServerAuthUtil.java          ✅ 완료 (Signal Server 인증 유틸)
├── auth/filter/                   ✅ 완료 (인증 필터)
│   ├── JwtAuthenticationFilter.java       ✅ 완료 (웹 클라이언트용)
│   └── SignalServerTokenFilter.java       ✅ 완료 (Signal Server용)
└── config/SecurityConfig.java     ✅ 완료 (보안 설정)
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
├── index.js                       ✅ 완료 (메인 서버 파일, Bearer 토큰 인증)
├── Dockerfile                     ✅ 완료 (경량 이미지, opus 제외)
├── package.json                   ✅ 완료 (의존성 설정)
└── services/                      ✅ 완료 (서비스 레이어)
    └── MessageBufferService.js    ✅ 완료 (Redis 버퍼링, Signal Server API 통합)
```

### Docker 설정 (/config/dockercompose)
```
/config/dockercompose/
├── docker-compose.dev.yaml        ✅ 완료 (개발환경용)
├── docker-compose.local.yaml      ✅ 완료 (로컬환경용, 새로 추가)
└── docker-compose.prod.yaml       ✅ 기존 (운영환경용)
```

### Docker 이미지 (/docker)
```
/docker/
├── signal-server/
│   └── Dockerfile                 ✅ 완료 (경량, opus 제외)
├── discord-bot/
│   └── Dockerfile                 ✅ 완료 (opus 포함)
└── mariadb/db/migrations/         ✅ 완료 (V1.4.0, V1.4.1)
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

## 📊 예상 개발 일정 (최종 업데이트)

- **1단계** ✅ **완료**: 로컬 환경 통합 테스트 및 검증
- **2단계** ✅ **완료**: 서버-채널 REST API 완성 (Channel, Message Controller)
- **3단계** ✅ **완료**: 시그널 서버 + 프론트엔드 상태 관리 업데이트
- **4단계** ✅ **완료**: Discord 스타일 UI + 기본 채팅 기능
- **5단계** ✅ **완료**: WebRTC 기반 구조 + 음성 채널 API
- **6단계** ✅ **완료**: 권한 시스템 + 사용자 관리 기능
- **7단계** ✅ **완료**: 전체 테스트 + 생산 환경 준비
- **8단계** 🚧 **진행중**: UI/UX 최종 완성 + 성능 최적화

**현재 진행률**: 97% 완료  
**남은 작업**: Cloudflare Realtime API 세부 수정 및 SFU 아키텍처 완성 (Phase 1-1 완료, SFU 통합 문제 수정 완료)

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

### 🐳 Docker 인프라 개선 ⭐️ **NEW**
- **이미지 분리**: Signal Server (경량) + Discord Bot (opus 포함)
- **로컬 환경 구축**: `docker-compose.local.yaml` 완전 분리
- **의존성 충돌 해결**: @discordjs/opus 네이티브 모듈 문제 해결
- **개발 효율성**: 로컬에서 전체 Voice Chat 스택 테스트 가능

### 🔧 개발환경 설정 완료 ⭐️ **NEW**
- **Vite 프록시**: WebSocket 연결 지원
- **Nginx 설정**: 로컬 환경 WebSocket 업그레이드
- **Spring Boot**: Voice Chat 환경변수 및 PasswordEncoder 빈 추가
- **전체 통합**: 프론트엔드 ↔ Spring Boot ↔ Signal Server ↔ Redis 연동 완료

### 🎤 WebRTC 음성 채팅 시스템 완성 ⭐️ **LATEST**
- **TURN 서버 인증 해결**: 401 Unauthorized 에러 완전 수정
  - 환경변수 동기화 및 시간 기반 동적 credential 생성
  - HMAC-SHA1 + Base64 인증 방식으로 Docker Compose와 통일
- **React Hook 오류 수정**: 함수 초기화 순서 문제 해결
- **WebRTC P2P 연결**: NAT 환경에서도 정상 작동하는 음성 연결 구현
- **Signal Server 개선**: 음성 채널 입장 시 기존 사용자 목록 자동 전송
- **프론트엔드 UI**: VoiceArea 컴포넌트 및 실시간 음성 사용자 관리

### 🎯 Cloudflare Realtime SFU 통합 최종 수정 ⭐️ **COMPLETED**
- **자동 종료 문제 완전 해결**: useEffect cleanup 로직 정밀화로 안정적인 음성 연결 유지
- **사이드바 참여자 실시간 표시**: WebSocket 이벤트 기반 voiceUsers 상태 동기화
- **원격 오디오 수신/재생**: RemoteAudioPlayer 컴포넌트로 다중 사용자 오디오 처리
- **TrackId 기반 SFU 관리**: Signal Server와 프론트엔드 간 trackId 동기화 완료

### 🔧 Cloudflare SFU 백엔드 프록시 문제 해결 진행중 ⭐️ **IN PROGRESS**
- **CORS 문제 해결 완료**: Spring Security 및 JWT 필터에서 `/api/v1/cloudflare/**` 경로 예외 처리
- **백엔드 프록시 구현**: CloudflareProxyController로 Cloudflare API 호출 중계
- **트랙 구독 500 에러 디버깅중**: 
  - CloudflareProxyController에 에러 로깅 추가
  - 프론트엔드에서 `location: 'remote'` 트랙 구독 시 백엔드 에러 발생
  - Cloudflare API 응답 형식 불일치 또는 WebClient 설정 문제로 추정
- **음성 사용자 목록 사라짐 문제**: 트랙 구독 실패 시 voiceUsers 상태 초기화 방지 필요