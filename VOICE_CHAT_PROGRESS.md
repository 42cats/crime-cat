# Voice Chat 시스템 진행 상황

## 개요
Crime Cat 프로젝트의 음성 채팅 시스템 구현 및 문제 해결 진행 상황

## 주요 문제점 및 해결 과정

### 🎯 Phase 1: Signal Server 단일 진실 소스 구현 (완료)

#### 문제점
- voiceUsers 배열이 빈 배열로 표시되는 문제
- WebSocket 이벤트 리스너 중복 등록 (6번씩 호출)
- 다중 레이어 인증 체계로 인한 동기화 실패
- React 컴포넌트 상태와 Signal Server 상태 불일치

#### 해결책
1. **Signal Server를 단일 진실 소스로 설정**
   - Backend API 호출 제거
   - Signal Server가 모든 음성 상태 관리
   - Frontend는 구독 전용 모드로 변경

2. **WebSocket 이벤트 중복 제거**
   - 모든 음성 관련 이벤트를 단일 useEffect로 통합
   - 의존성 배열을 빈 배열로 설정하여 한 번만 등록

3. **상태 관리 단순화**
   - Signal Server 우선 로직 구현
   - 상태 병합 대신 Signal Server 데이터로 덮어쓰기
   - 클로저 캡처 문제 해결을 위한 ref 사용

#### 수정된 파일
- `frontend/src/hooks/useVoiceChatSFU.ts` - Phase 1 개선 로직 적용
- `docker/signal-server/index.js` - Backend API 호출 제거
- `frontend/src/store/useAppStore.ts` - Signal Server 우선 로직 추가

### 🌐 외부 IP 접속 지원 구현 (완료)

#### 요구사항
- `https://10.19.202.74:5173` 접속 지원
- 멀티 디바이스 테스트 환경 구성

#### 구현 내용
1. **CORS 설정 추가**
   - Signal Server에 동적 CORS origin 로딩
   - Backend에 외부 IP CORS 지원 추가

2. **환경 변수 설정**
   - `/config/.env.local`에 외부 IP 설정 추가
   - Cookie 도메인 설정 비활성화
   - SameSite 정책을 Lax로 변경

3. **Vite 설정 수정**
   - `host: "0.0.0.0"`으로 외부 접속 허용
   - HMR 호스트를 외부 IP로 설정

#### 수정된 파일
- `config/.env.local` - 외부 IP 환경 변수 추가
- `frontend/vite.config.ts` - 외부 IP 접속 설정
- `docker-compose.yaml` - CORS 환경 변수 추가
- `backend/src/main/java/com/crimecat/backend/config/WebConfig.java` - 동적 CORS 설정
- `backend/src/main/resources/application-local.yml` - 외부 접속 설정

### 🔒 HTTPS/WSS 통합 보안 연결 구현 (완료)

#### 문제점
- Mixed Content 오류 (HTTPS 페이지에서 HTTP WebSocket 연결 시도)
- 브라우저 보안 정책으로 인한 연결 차단

#### 해결책
1. **Signal Server SSL 지원 추가**
   - 자체 서명 SSL 인증서 자동 생성
   - HTTPS/WSS 프로토콜 지원
   - OpenSSL을 사용한 개발용 인증서 생성

2. **프론트엔드 HTTPS 활성화**
   - Vite basicSsl() 플러그인 활성화
   - HMR을 WSS 프로토콜로 변경
   - Signal Server URL을 HTTPS로 업데이트

3. **Docker 환경 업데이트**
   - SSL 환경 변수 추가
   - 헬스체크를 HTTPS로 변경

#### 수정된 파일
- `docker/signal-server/index.js` - SSL/HTTPS 지원 추가
- `config/.env.local` - SSL 활성화 및 HTTPS URL 설정
- `frontend/vite.config.ts` - HTTPS 및 WSS 설정
- `docker-compose.yaml` - SSL 환경 변수 및 HTTPS 헬스체크

## 현재 아키텍처

### 전체 시스템 구조
```
Frontend (HTTPS) ←→ Signal Server (HTTPS/WSS) ←→ Backend API (HTTP)
                ↓
            Cloudflare Realtime SFU + TURN
```

### 음성 채팅 흐름
1. **연결 단계**
   - Frontend → Signal Server (WSS 연결)
   - JWT 토큰 기반 인증
   - 음성 채널 참가 요청

2. **상태 관리**
   - Signal Server가 단일 진실 소스
   - Frontend는 구독 전용 모드
   - 실시간 상태 동기화

3. **WebRTC 연결**
   - Cloudflare Realtime SFU 사용
   - 자동 TURN 서버 제공
   - P2P 대신 SFU 방식

## 환경 설정

### 주요 환경 변수
```bash
# SSL 설정
SIGNAL_USE_SSL=true
VITE_SIGNAL_SERVER_URL=https://10.19.202.74:4000

# 외부 IP 접속
SUBDOMAINS=10.19.202.74:5173
EXTERNAL_ACCESS_ENABLED=true
COOKIE_DOMAIN_ENABLED=false

# Cloudflare 설정
CF_REALTIME_APP_ID=5e31a2e46e3c4f4b19dfe2189c0a4216
CF_TURN_KEY_ID=6f0d3ec07b26214bedfda5462e9ce392
```

## 테스트 상태

### ✅ 완료된 기능
- Signal Server WebSocket 연결 성공
- JWT 인증 시스템 동작
- 음성 채널 참가/퇴장 이벤트 처리
- 사용자 목록 실시간 동기화
- 외부 IP 접속 지원
- HTTPS/WSS 보안 연결

### 🔄 진행 중인 작업
- 마이크 권한 허용 문제 해결
- WebRTC 미디어 스트림 연결 테스트

### 📋 다음 단계
1. SSL 인증서 관련 브라우저 경고 해결
2. 멀티 디바이스 음성 채팅 테스트
3. Cloudflare SFU 연결 검증
4. 음성 품질 최적화

## 기술 스택

### Frontend
- React + TypeScript
- Zustand (상태 관리)
- Socket.IO Client
- Vite (빌드 도구, HTTPS 지원)

### Backend Services
- Signal Server: Node.js + Express + Socket.IO (HTTPS/WSS)
- Main Backend: Spring Boot (HTTP)
- Database: MariaDB
- Cache: Redis

### WebRTC Infrastructure
- Cloudflare Realtime SFU
- Cloudflare TURN Server
- 자체 Speaking Detection

## 보안 고려사항

### SSL/TLS 설정
- 개발환경: 자체 서명 인증서 사용
- 운영환경: 유효한 SSL 인증서 필요

### 인증 체계
- JWT 토큰 기반 인증
- Signal Server에서 토큰 검증
- 세션 기반 상태 관리

### CORS 정책
- 동적 Origin 허용 목록
- 외부 IP 접속 지원
- Cookie SameSite 정책 적용

---

**최종 업데이트**: 2025-07-05
**상태**: Phase 1 완료, HTTPS 통합 완료, 마이크 권한 문제 해결 중