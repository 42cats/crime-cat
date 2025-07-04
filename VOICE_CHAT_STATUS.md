# 음성 채팅 시스템 현재 상황 및 아키텍처 문서

## 📋 현재 상황 요약

음성 채팅 시스템은 Cloudflare Realtime SFU를 기반으로 하여 WebRTC 기술을 통해 실시간 음성 통신을 제공합니다. 다음과 같은 주요 문제들이 해결되었습니다:

### ✅ 해결된 주요 문제들

1. **406 Not Acceptable 에러 해결**
   - 원인: Cloudflare API 요청 시 `sessionId` 필드 누락
   - 해결: OpenAPI 스펙에 따라 sessionId 필드 추가

2. **WebRTC M-line 순서 에러 해결**
   - 원인: 여러 사용자 접속 시 트랜시버 재생성으로 인한 SDP 순서 불일치
   - 해결: 트랜시버 풀 사전 생성 및 재사용 로직 구현

3. **인증 시스템 충돌 해결**
   - 원인: Signal Server와 Backend 간 인증 컨텍스트 불일치
   - 해결: WebUser.id 기반 통일된 ID 체계 적용

4. **세션 ID 누락 문제 해결**
   - 원인: 컴포넌트 계층 간 sessionId 전달 오류
   - 해결: React 클로저 캡처 이슈 수정 및 의존성 배열 정리

## 🆔 ID 사용 패턴 정리

### WebUser.id vs User.id 사용 기준

현재 시스템에서는 **WebUser.id**를 우선적으로 사용합니다:

#### WebUser.id 사용 영역
- **Signal Server 통신**: 모든 WebSocket 기반 실시간 통신
- **음성 채팅 세션**: SFU 트랙 관리 및 음성 사용자 식별
- **Frontend 상태 관리**: useAppStore의 VoiceUser 인터페이스
- **Backend 음성 API**: VoiceSessionController에서 권한 검증

#### User.id 사용 영역
- **일반적인 Backend API**: 기존 Spring Security 기반 인증
- **데이터베이스 관계**: JPA 엔티티 간 외래키 관계
- **일반 HTTP API**: 채팅, 서버 관리 등

```typescript
// Frontend에서 ID 사용 예시
interface VoiceUser {
  id: string;          // 메인 ID (WebUser.id 값)
  userId?: string;     // 하위 호환성용 (User.id 값)
  username: string;
  serverId: string;
  channelId: string;
  // ...
}
```

```java
// Backend에서 ID 사용 예시
@PostMapping("/end")
public ResponseEntity<?> endVoiceSession(
    @RequestBody VoiceSessionEndRequest request,
    HttpServletRequest httpRequest
) {
    WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(httpRequest);
    // WebUser.id 사용 (Signal Server 컨텍스트)
    voiceSessionService.endSession(request, currentUser.getId());
    return ResponseEntity.ok().build();
}
```

## 🌐 API 통신 아키텍처

### 1. Frontend → Backend → Cloudflare SFU 프록시 패턴

```
Frontend (React)
    ↓ HTTP Request
Backend (Spring Boot)
    ↓ HTTP Request  
Cloudflare Realtime API
```

#### 장점
- API 키 보안 (Backend에서 관리)
- CORS 정책 통일화
- 에러 처리 중앙화
- 요청/응답 로깅 및 모니터링

#### 구현 파일
- **Frontend**: `cloudflareProxyService.ts`
- **Backend**: `CloudflareController.java`

### 2. 실시간 통신: Frontend ↔ Signal Server

```
Frontend (React + Socket.IO Client)
    ↔ WebSocket
Signal Server (Node.js + Socket.IO)
```

#### 통신 패턴
- **인증**: JWT 토큰 기반
- **이벤트**: voice:join, voice:leave, sfu:track:* 등
- **상태 동기화**: 실시간 음성 사용자 목록 관리

#### 구현 파일
- **Frontend**: `websocketService.ts`, `useVoiceChatSFU.ts`
- **Signal Server**: `/docker/signal-server/index.js`

## 🔧 핵심 컴포넌트 아키텍처

### useVoiceChatSFU Hook

```typescript
// 주요 기능
- WebRTC PeerConnection 관리
- 트랜시버 풀 사전 생성 (8개)
- SFU 세션 및 트랙 관리
- Speaking Detection
- 에러 처리 및 복구
```

#### 트랜시버 풀 관리 전략
```typescript
// 초기화 시 8개 트랜시버 사전 생성
const maxUsers = 8;
for (let i = 0; i < maxUsers; i++) {
  const transceiver = pc.addTransceiver('audio', {
    direction: 'inactive',
    streams: []
  });
}

// 사용자 참여 시 재사용
const availableTransceiver = existingTransceivers.find(t => 
  t.direction === 'inactive' && 
  (!t.receiver.track || t.receiver.track.readyState === 'ended')
);

// 사용자 떠날 때 비활성화 (재사용 대기)
relatedTransceiver.direction = 'inactive';
```

### cloudflareProxyService

```typescript
// 주요 API 엔드포인트
- generateTurnCredentials(): TURN 서버 자격증명
- createSession(): SFU 세션 생성
- publishTrack(): 오디오 트랙 발행
- subscribeToTrack(): 원격 트랙 구독
- closeTrack(): 트랙 종료
```

## 🔐 인증 및 권한 시스템

### 1. Frontend 인증
```typescript
// JWT 토큰 기반
const token = await fetch('/api/v1/auth/websocket-token', {
  credentials: 'include'
});
```

### 2. Signal Server 인증
```javascript
// Socket.IO 인증 미들웨어
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // JWT 검증 로직
});
```

### 3. Backend 인증
```java
// Spring Security + 커스텀 헤더 인증
@Component
public class SignalServerAuthUtil {
    public WebUser extractUserFromHeaders(HttpServletRequest request) {
        // X-User-Id, X-Username 헤더에서 사용자 정보 추출
    }
}
```

## 📡 WebRTC 연결 흐름

### 1. 음성 채널 참여
```
1. websocketService.joinVoiceChannel()
2. useVoiceChatSFU.handleVoiceJoin()
3. PeerConnection 초기화 + 트랜시버 풀 생성
4. getUserMedia() → 로컬 스트림 획득
5. cloudflareProxyService.createSession()
6. cloudflareProxyService.publishTrack()
```

### 2. 원격 사용자 트랙 구독
```
1. voice:user-joined 이벤트 수신
2. subscribeToRemoteTrack() 호출
3. 트랜시버 풀에서 재사용 가능한 트랜시버 찾기
4. cloudflareProxyService.subscribeToTrack()
5. setRemoteDescription() → 오디오 재생
```

### 3. 연결 해제
```
1. websocketService.leaveVoiceChannel()
2. 모든 트랙 중단
3. 트랜시버 비활성화 (재사용 대기)
4. PeerConnection 정리
```

## 🐛 해결된 버그와 수정사항

### 1. sessionId 누락 문제
**문제**: Cloudflare API 호출 시 406 에러
```typescript
// Before (문제)
tracks: [{
  location: 'remote',
  trackName: trackName
}]

// After (해결)
tracks: [{
  location: 'remote',
  sessionId: remoteSessionId || sessionId, // 필수 필드 추가
  trackName: trackName
}]
```

### 2. WebRTC M-line 순서 에러
**문제**: "The order of m-lines in subsequent offer doesn't match order from previous offer/answer"
```typescript
// Before (문제): 매번 새로운 트랜시버 생성
pc.addTransceiver('audio', { direction: 'recvonly' });

// After (해결): 트랜시버 풀 재사용
const availableTransceiver = existingTransceivers.find(t => 
  t.direction === 'inactive'
);
if (availableTransceiver) {
  availableTransceiver.direction = 'recvonly';
}
```

### 3. React 클로저 캡처 이슈
**문제**: 이벤트 핸들러에서 stale closure로 인한 상태 불일치
```typescript
// Before (문제)
useEffect(() => {
  websocketService.on('voice:user-joined', handleUserJoined);
}, []); // sfuSessionId 의존성 누락

// After (해결)
useEffect(() => {
  const currentSfuSessionId = sfuSessionId; // 로컬 참조 생성
  websocketService.on('voice:user-joined', handleUserJoined);
}, [sfuSessionId]); // 의존성 배열에 추가
```

### 4. 인증 컨텍스트 불일치
**문제**: Signal Server 요청이 Spring Security 컨텍스트를 설정하지 않음
```java
// Before (문제)
User currentUser = authenticationUtil.getCurrentUser(); // null 반환

// After (해결)
WebUser currentUser = signalServerAuthUtil.extractUserFromHeaders(request);
voiceSessionService.endSession(request, currentUser.getId());
```

## 📈 성능 최적화

### 1. 트랜시버 풀링
- 사전에 8개 트랜시버 생성하여 재사용
- M-line 순서 일관성 보장
- 연결 시간 단축

### 2. 에러 복구 메커니즘
- 410 Gone 에러 시 자동 세션 정리
- 네트워크 오류 시 재연결 로직
- 폴백 STUN 서버 제공

### 3. 메모리 관리
- 사용자 퇴장 시 트랙 정리
- 이벤트 리스너 적절한 해제
- MediaStream 및 AudioContext 정리

## 🔮 향후 개선 사항

### 1. 확장성
- 동적 트랜시버 풀 크기 조정
- 채널별 최대 사용자 수 제한 설정
- 서버 부하 모니터링

### 2. 사용자 경험
- 연결 상태 시각적 피드백 개선
- 오디오 품질 자동 조정
- 네트워크 상태 기반 최적화

### 3. 보안 강화
- End-to-End 암호화 검토
- API 요청 Rate Limiting
- 인증 토큰 갱신 자동화

---

**마지막 업데이트**: 2025-01-25  
**작성자**: Claude Code Assistant  
**버전**: 1.0.0