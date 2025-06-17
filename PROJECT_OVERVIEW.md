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
  - WebRTC 기반 P2P 음성 통신
  - 음성 변조 효과 (익명성 보장)
  - 음성 품질 자동 조절
  - 화면 공유 지원

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
- **Coturn** (TURN 서버, NAT 통과)
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

### **Phase 2: 고급 기능 (예정)**
1. **음성 채팅 시스템**
   - WebRTC P2P 연결
   - 음성 변조 효과
   - 화면 공유 기능

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

### **현재 상태 (80% 완료)**
- ✅ 데이터베이스 스키마 설계
- ✅ Spring Boot 도메인 엔티티
- ✅ 커스텀 역할 시스템
- ✅ Redis 메시지 버퍼링
- ✅ Docker 인프라 구성
- 🚧 서버-채널 REST API

### **다음 단계 (2-3주)**
- 📝 시그널 서버 서버-채널 적용
- 📝 React UI 컴포넌트
- 📝 텍스트 채팅 기능
- 📝 기본 권한 시스템

### **미래 계획 (1-3개월)**
- 📝 WebRTC 음성 채팅
- 📝 고급 관리 도구
- 📝 모바일 최적화
- 📝 성능 튜닝

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

#### **상태 관리 (Zustand)**
```
/frontend/src/store/
└── useAppStore.ts                      🔑 전역 상태
    ├── chatState                       채팅 상태 (메시지, 연결)
    ├── voiceState                      음성 상태 (참여자, 효과)
    ├── serverState                     📝 예정 (서버 목록, 선택)
    ├── channelState                    📝 예정 (채널 목록, 권한)
    └── roleState                       📝 예정 (역할, 권한)
```

---

## 📊 **개발 현황 요약**

### **✅ 완료된 핵심 시스템 (80%)**
1. **데이터베이스**: 서버-채널 스키마 + 커스텀 역할 시스템
2. **백엔드 도메인**: 엔티티 + Repository + 역할 관리 Service/Controller
3. **실시간 인프라**: Redis 버퍼링 + Signal Server + TURN Server
4. **Docker 통합**: 모든 서비스 컨테이너화 완료

### **🚧 진행 중 (20%)**
1. **서버-채널 REST API**: ServerController, ChannelController 구현 중
2. **에러 처리**: ErrorStatus 확장 + 검증 시스템

### **📝 다음 단계**
1. **시그널 서버**: 서버-채널 구조 적용
2. **React UI**: Discord 스타일 컴포넌트
3. **WebRTC**: 음성 채팅 통합

---

## 📞 **프로젝트 정보**

**Repository**: `/Users/byeonsanghun/goinfre/crime-cat/`  
**Development Status**: [VOICE_CHAT_DEVELOPMENT_STATUS.md](./VOICE_CHAT_DEVELOPMENT_STATUS.md)  
**Branch**: `common/voice_chat`  
**Docker Environment**: `docker-compose.dev.yaml`