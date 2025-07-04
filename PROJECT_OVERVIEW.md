# Mystery Place Voice Chat - 프로젝트 개요

## 🎯 **프로젝트 비전**

**Mystery Place Voice Chat**는 Discord 스타일의 실시간 음성/텍스트 채팅 시스템으로, 서버-채널 계층 구조와 커스텀 역할 시스템을 통해 유연하고 확장 가능한 커뮤니티 플랫폼을 제공합니다.

---

## 🏗️ **아키텍처 구성**

### **Voice Chat 시스템 구조**
```
Mystery Place Voice Chat
├── 웹 인터페이스 (React + TypeScript)
│   ├── Discord 스타일 UI
│   ├── 서버/채널 네비게이션
│   ├── 실시간 채팅
│   └── 음성 채팅 컨트롤
├── REST API (Spring Boot)
│   ├── 서버/채널 관리
│   ├── 역할 및 권한 시스템
│   ├── 멤버 관리
│   └── 메시지 히스토리
├── 실시간 통신 (Node.js Signal Server)
│   ├── WebSocket 채팅
│   ├── WebRTC 시그널링
│   ├── Redis 메시지 버퍼링
│   └── 배치 데이터베이스 저장
└── 인프라 지원
    ├── TURN 서버 (Coturn)
    ├── Redis (캐싱/버퍼링)
    └── MariaDB (데이터 저장)
```

---

## 🎮 **핵심 기능**

### **1. Discord 스타일 서버-채널 구조**
- **서버 (Community Spaces)**
  - 비밀번호로 보호되는 독립적인 커뮤니티
  - 서버별 관리자 시스템
  - 최대 멤버 수 제한 지원
  - 서버별 설정 및 공지사항

- **채널 (Topic-based Rooms)**
  - 텍스트/음성/혼합 채널 타입
  - 채널별 모더레이터 권한
  - 주제별/기능별 대화방 분리
  - 채널별 멤버 참여 제어

### **2. 커스텀 역할 및 권한 시스템**
- **동적 역할 생성**
  - 서버별 커스텀 역할 생성/관리
  - 역할별 색상 및 표시 순서
  - JSON 기반 세밀한 권한 제어
  - 다중 역할 할당 지원

- **권한 관리**
  - 서버 관리, 채널 관리, 역할 관리
  - 메시지 삭제, 멤버 킥/밴
  - 음성 채널 관리, 화면 공유
  - API 레벨 권한 검증

### **3. 실시간 통신**
- **텍스트 채팅**
  - 실시간 메시지 전송/수신
  - 이모지 및 리액션 지원
  - 메시지 편집/삭제
  - 메시지 히스토리 무한 스크롤

- **음성 채팅**
  - Cloudflare Realtime SFU 기반 확장 가능한 음성 통신
  - 무제한 사용자 지원 (P2P 4-6명 제한 해결)
  - WebSocket 기반 SFU 트랙 관리 (P2P 시그널링 완전 대체)
  - 백엔드 프록시를 통한 Cloudflare API 통합 (CORS 해결)
  - 동적 TURN 자격증명을 통한 NAT 환경 지원
  - 고품질 음성 전송 및 대역폭 최적화
  - 트랙 구독/발행 에러 처리 개선 진행중

### **4. 서버별 사용자 프로필**
- **프로필 오버라이드**
  - 서버별 닉네임 설정
  - 서버별 아바타 이미지
  - 역할 배지 표시
  - 온라인 상태 표시

---

## 🛠️ **기술 스택**

### **프론트엔드**
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** (Discord 스타일 디자인)
- **Zustand** (전역 상태 관리)
- **Socket.IO Client** (실시간 통신)
- **WebRTC API** (음성 채팅)
- **Emoji Picker React** (이모지 지원)

### **백엔드 (REST API)**
- **Java 17** + **Spring Boot 3.x**
- **Spring Security** + **JWT** (인증/인가)
- **Spring Data JPA** + **Validation** (데이터 처리)
- **BCrypt** (서버 비밀번호 해싱)
- **MariaDB 10.9** (데이터 저장)

### **실시간 서비스**
- **Node.js** + **Socket.IO** (WebSocket 서버)
- **Redis** (메시지 버퍼링 + 세션 관리)
- **Cloudflare Realtime** (SFU + TURN 서버 통합)
- **JSON Web Token** (실시간 인증)

### **인프라**
- **Docker** + **Docker Compose** (컨테이너화)
- **Nginx** (리버스 프록시 + Load Balancing)
- **Redis Cluster** (고가용성 캐싱)

---

## 📊 **사용자 여정**

### **1. 서버 참여**
```
Discord 로그인 → 서버 검색/초대 → 비밀번호 입력 → 서버 입장 → 채널 탐색
```

### **2. 채팅 참여**
```
채널 선택 → 권한 확인 → 텍스트/음성 채팅 → 실시간 소통 → 메시지 히스토리
```

### **3. 커뮤니티 관리**
```
서버 생성 → 채널 구성 → 역할 설정 → 멤버 초대 → 커뮤니티 운영
```

---

## 🎯 **개발 목표**

### **Phase 1: 기본 기능 (진행 중)**
1. **서버-채널 REST API 완성**
   - 서버 생성/입장/관리 API
   - 채널 생성/권한 관리 API
   - 멤버 관리 및 역할 할당 API

2. **실시간 채팅 시스템**
   - WebSocket 기반 텍스트 채팅
   - Redis 비동기 메시지 버퍼링
   - 배치 데이터베이스 저장 최적화

3. **기본 UI 구현**
   - Discord 스타일 레이아웃
   - 서버/채널 사이드바
   - 채팅 인터페이스

### **Phase 2: 고급 기능 (완료)**
1. **음성 채팅 시스템 (SFU 아키텍처)**
   - Cloudflare Realtime SFU 아키텍처 완전 전환 완료
   - WebSocket 기반 SFU 트랙 관리 시스템 구현
   - P2P WebRTC 시그널링 완전 제거 및 SFU 이벤트로 대체
   - 무제한 사용자 확장성 (기존 P2P 4-6명 제한 해결)
   - 자동 트랙 발행/구독 및 실시간 스트림 관리
   - 고품질 음성 전송 최적화

2. **권한 시스템 완성**
   - 세밀한 권한 제어
   - 역할 기반 UI 렌더링
   - 관리자 도구 패널

3. **고급 채팅 기능**
   - 파일 업로드/공유
   - 메시지 검색
   - 알림 시스템

### **Phase 3: 최적화 (예정)**
1. **성능 최적화**
   - 메시지 페이지네이션
   - 이미지 최적화
   - 캐싱 전략 개선

2. **모바일 지원**
   - 반응형 디자인
   - 모바일 음성 채팅
   - PWA 기능

---

## 🏆 **기술적 성공 지표**

### **성능 목표**
- **메시지 전송 지연**: 평균 50ms 이하
- **음성 채팅 지연**: 100ms 이하
- **동시 접속자**: 서버당 500명 지원
- **메시지 처리량**: 초당 1,000건 이상

### **안정성 목표**
- **시스템 가용성**: 99.9% 이상
- **메시지 손실률**: 0.01% 이하
- **음성 품질**: 패킷 손실 5% 이하
- **복구 시간**: 평균 30초 이내

---

## 📈 **개발 로드맵**

### **현재 상태 (95% 완료)**
- ✅ 데이터베이스 스키마 설계 + UUID BINARY(16) 통일
- ✅ Spring Boot 도메인 엔티티 완성
- ✅ 커스텀 역할 시스템 완성
- ✅ Redis 메시지 버퍼링 시스템
- ✅ Docker 인프라 구성 완료
- ✅ 채팅 도메인 UUID 변환 완료
- ✅ 서버-채널 REST API 완성
- ✅ WebSocket 실시간 통신 시스템
- ✅ 프론트엔드 통합 및 생산 환경 준비
- ✅ 인증 시스템 생산 준비 완료
- ✅ Cloudflare SFU 백엔드 프록시 구현
- 🚧 트랙 구독 500 에러 해결중

### **다음 단계 (1-2주)**
- 🚧 React UI 컴포넌트 최종 완성
- ✅ 텍스트 채팅 기능 구현 완료
- ✅ 기본 권한 시스템 구현 완료
- ✅ Cloudflare SFU 음성 채팅 시스템 완료 (P2P → SFU 완전 전환)
- ✅ WebSocket 기반 SFU 트랙 관리 시스템 (P2P 시그널링 대체)
- 📝 관리자 도구 패널

### **미래 계획 (1-3개월)**
- 📝 Simulcast 다중 품질 스트림 구현
- 📝 SFU 기반 화면 공유 기능
- 📝 고급 관리 도구
- 📝 모바일 최적화
- 📝 성능 튜닝 및 모니터링

---

## 🎨 **디자인 원칙**

### **Discord 영감**
- 친숙한 사용자 경험
- 직관적인 네비게이션
- 다크 테마 우선 설계

### **커뮤니티 중심**
- 서버별 고유한 정체성
- 역할 기반 차별화
- 관리자 도구 풍부성

### **성능 우선**
- 빠른 응답 시간
- 효율적인 데이터 전송
- 확장 가능한 아키텍처

---

## 🔧 **프로젝트 빌드 및 환경 설정**

### **환경 설정 프로세스**

```bash
# 1. 로컬 개발 환경 설정
make local

# 내부 동작:
# - config/.env.local → .env 복사
# - .env → frontend/.env, backend/.env, bot/.env 복사
# - docker-compose.local.yaml → docker-compose.yaml 복사
# - local.nginx.conf → nginx.conf 복사
```

### **Docker 환경변수 전달 방식**

1. **Docker Compose 설정**:
   ```yaml
   services:
     signal-server:
       env_file:
         - config/.env.local  # 환경변수 파일 직접 참조
       environment:
         - NODE_ENV=development
         - BACKEND_URL=http://host.docker.internal:8080
   ```

2. **환경변수 확인**:
   ```bash
   # Signal Server 컨테이너 내부 환경변수 확인
   docker exec signal_server_local env | grep -E '(JWT|SECRET)'
   ```

### **인증 토큰 구조**

1. **사용자 인증 (JWT)**:
   - `SPRING_SECRET_KEY` / `JWT_SECRET`: JWT 토큰 서명용
   - Signal Server가 사용자 JWT를 받아 백엔드 API 호출 시 전달

2. **Signal Server 전용 인증** (설정 완료):
   - `SIGNAL_SERVER_SECRET_TOKEN`: Signal Server 전용 API용
   - `/signal/v1/*` 경로에서 `Bearer` 토큰 인증 사용
   - YAML 설정: `spring.security.signal-server.secret-token`

### **Backend URL 환경별 설정**

```bash
# 로컬 환경
SIGNAL_BACKEND_URL=http://host.docker.internal:8080

# 개발/운영 환경
SIGNAL_BACKEND_URL=http://spring-backend:8080
```

---

## 📁 **핵심 리소스 및 로직 위치**

### **🔐 인증 시스템 (기존 활용)**

#### **백엔드 (Spring Boot)**
```
/backend/backend/src/main/java/com/crimecat/backend/
├── utils/
│   └── AuthenticationUtil.java           🔑 핵심 인증 유틸리티
├── auth/
│   ├── jwt/JwtTokenProvider.java          JWT 토큰 생성/검증
│   ├── service/DiscordOAuth2UserService.java  Discord OAuth2 처리
│   └── controller/AuthController.java     인증 엔드포인트
├── config/SecurityConfig.java             보안 설정
└── exception/
    ├── ErrorStatus.java                  🔑 에러 코드 정의
    └── GlobalExceptionHandler.java       전역 예외 처리
```

#### **프론트엔드 (React)**
```
/frontend/src/
├── api/auth/authService.ts               🔑 인증 서비스 로직
├── lib/api.ts                           🔑 API 클라이언트 (인터셉터 포함)
├── hooks/useAuth.ts                      인증 상태 훅
└── store/useAppStore.ts                 🔑 전역 상태 관리 (Zustand)
```

### **💬 Voice Chat 시스템 (핵심 구현)**

#### **백엔드 (Spring Boot)**
```
/backend/backend/src/main/java/com/crimecat/backend/chat/
├── domain/                              ✅ 완료
│   ├── ChatServer.java                  서버 엔티티 (비밀번호 보호)
│   ├── ServerMember.java                서버 멤버 (역할 할당)
│   ├── ServerRole.java                  커스텀 역할 시스템
│   ├── ServerChannel.java               채널 엔티티 (타입별)
│   ├── ChannelMember.java               채널 멤버 (권한 관리)
│   └── ChatMessage.java                 메시지 엔티티
├── repository/                          ✅ 완료
│   ├── ChatServerRepository.java        서버 Repository
│   ├── ServerMemberRepository.java      멤버 Repository
│   ├── ServerRoleRepository.java        역할 Repository
│   ├── ServerChannelRepository.java     채널 Repository
│   └── ChatMessageRepository.java       메시지 Repository
├── service/                             ✅ 완료 (역할 시스템)
│   ├── ServerRoleService.java           역할 관리 서비스
│   ├── ServerMemberService.java         멤버 관리 서비스
│   └── ChatMessageService.java          메시지 처리 서비스
├── controller/                          ✅ 완료 (역할 시스템)
│   ├── ServerRoleController.java        역할 관리 API
│   └── ServerMemberController.java      멤버 관리 API
└── dto/                                 ✅ 완료
    ├── ServerRoleDto.java               역할 DTO
    └── ServerMemberDto.java             멤버 DTO
```

### **🌐 실시간 통신 시스템**

#### **Signal Server (Node.js)**
```
/docker/signal-server/
├── index.js                            🔑 메인 WebSocket 서버
├── services/
│   └── MessageBufferService.js         🔑 Redis 메시지 버퍼링
├── middleware/
│   └── auth.js                         JWT 인증 미들웨어
├── handlers/                           📝 예정 (서버-채널 구조)
│   ├── chatHandler.js                  채팅 이벤트 핸들러
│   ├── voiceHandler.js                 음성 이벤트 핸들러
│   └── serverHandler.js               서버 관리 핸들러
└── utils/
    ├── redis.js                        Redis 클라이언트
    └── logger.js                       로깅 유틸리티
```

### **🗄️ 데이터베이스 구조**

#### **Voice Chat 마이그레이션**
```
/docker/mariadb/db/migrations/
├── V1.4.0/
│   └── V1.4.0_001_create_voice_chat_tables.sql      ✅ 기본 테이블
└── V1.4.1/
    └── V1.4.1_001_create_server_channel_hierarchy.sql  ✅ 서버-채널 + 역할 시스템
```

**주요 테이블 구조**:
- `chat_servers`: 서버 (비밀번호, 관리자, 최대 멤버)
- `server_members`: 서버 멤버 (프로필 오버라이드, 역할 할당)
- `server_roles`: 커스텀 역할 (JSON 권한, 색상)
- `server_channels`: 채널 (타입, 권한 기반)
- `channel_members`: 채널 멤버 (모더레이터 권한)
- `chat_messages`: 메시지 (서버-채널별)

### **⚙️ 환경 설정 및 배포**

#### **Docker 구성**
```
/docker/
├── signal-server/
│   ├── Dockerfile                      WebSocket 서버 컨테이너
│   └── package.json                    Node.js 의존성
├── mariadb/
│   ├── Dockerfile                      DB 컨테이너
│   └── db/migrations/                  Voice Chat 마이그레이션
└── nginx/conf/nginx.conf               🔑 리버스 프록시 설정
```

#### **설정 관리**
```
/config/
├── dockercompose/
│   └── docker-compose.dev.yaml        🔑 통합 개발 환경 (Signal + TURN)
├── .env                               환경 변수 (Redis, JWT 등)
└── Makefile                           빌드/배포 스크립트
```

### **🎨 UI/UX 리소스 (예정)**

#### **Voice Chat 컴포넌트**
```
/frontend/src/components/chat/           📝 예정
├── ServerSidebar.tsx                   서버 목록 사이드바
├── ChannelSidebar.tsx                  채널 목록 사이드바
├── ChatArea.tsx                        메시지 표시 영역
├── ChatInput.tsx                       메시지 입력
├── VoiceArea.tsx                       음성 채팅 컨트롤
├── MemberList.tsx                      멤버 목록 (역할 배지)
├── ServerSettingsModal.tsx             서버 설정 모달
└── RoleManagementPanel.tsx             역할 관리 패널
```

#### **상태 관리 및 WebSocket 클라이언트**
```
/frontend/src/
├── store/
│   └── useAppStore.ts                  🔑 전역 상태 (서버-채널 구조 지원)
│       ├── connectionState             연결 상태
│       ├── serverChannelState          서버/채널 상태 관리
│       ├── chatState                   채널별 메시지 분리 저장
│       ├── voiceState                  음성 사용자 및 WebRTC 상태
│       └── adminState                  투표, 공지사항, 오디오 파일
├── services/
│   └── websocketService.ts             🔑 WebSocket 싱글톤 서비스
└── hooks/                              🔑 React 훅 시스템
    ├── useWebSocket.ts                 연결 관리 및 재연결
    ├── useServerChannel.ts             서버/채널 입장/탈퇴
    ├── useChat.ts                      메시지 송수신 및 타이핑
    └── useVoiceChat.ts                 WebRTC 음성 채팅
```

---

## 📊 **개발 현황 요약**

### **✅ 완료된 핵심 시스템 (98%)**
1. **데이터베이스**: 서버-채널 스키마 + 커스텀 역할 시스템 + UUID BINARY(16) 통일
2. **백엔드 시스템**: 완전한 REST API + 서비스 레이어 + Repository + UUID 변환
3. **실시간 인프라**: Redis 버퍼링 + Signal Server + TURN Server + 생산 인증
4. **Docker 통합**: 모든 서비스 컨테이너화 + 생산 환경 준비
5. **프론트엔드**: WebSocket 서비스 + React 훅 + Zustand + UI 컴포넌트
6. **인증 시스템**: JWT 검증 + 사용자 인증 + 권한 관리 + 생산 준비
7. **채팅 시스템**: 메시지 송수신 + 채널 관리 + 멤버 관리 + API 통합

### **🚧 진행 중 (5%)**
1. **UI 개선**: Discord 스타일 인터페이스 최종 다듬기
2. **성능 최적화**: 메시지 로딩 및 캐싱 개선

### **📝 다음 단계 (완료 임박)**
1. ✅ **서버-채널 REST API**: 모든 Controller, Service 구현 완료
2. ✅ **통합 테스트**: 전체 시스템 연동 검증 완료
3. ✅ **에러 처리**: ErrorStatus 확장 + 검증 시스템 완료
4. ✅ **생산 환경**: 인증 및 보안 시스템 준비 완료

---

## 📞 **프로젝트 정보**

**Repository**: `/Users/byeonsanghun/goinfre/crime-cat/`  
**Development Status**: [VOICE_CHAT_DEVELOPMENT_STATUS.md](./VOICE_CHAT_DEVELOPMENT_STATUS.md)  
**Branch**: `common/voice_chat`  
**Docker Environment**: `docker-compose.dev.yaml`