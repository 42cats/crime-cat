# 음성 전달 기능 테스트 시나리오 및 검증 방법

## 현재 아키텍처 개요

### 음성 시스템 구조
- **Frontend**: useVoiceChatSFU Hook (WebRTC + Speaking Detection)
- **Backend**: Cloudflare Proxy API (TURN/SFU 서비스)
- **Signal Server**: WebSocket 기반 상태 관리 및 알림
- **Cloudflare Realtime SFU**: 실제 오디오 스트림 처리

### 데이터 플로우
1. 사용자 음성 채널 참가 → WebSocket 알림
2. 로컬 스트림 생성 → Cloudflare SFU 세션 생성
3. 트랙 발행 → 다른 사용자들에게 알림
4. 자동 트랙 구독 → 실시간 오디오 스트림 수신

---

## 1. 단계별 테스트 케이스

### 🔥 Phase 1: 단일 사용자 접속 테스트

#### 테스트 목표
- 기본적인 연결 설정 검증
- 로컬 스트림 생성 및 발행 확인
- UI 상태 반영 검증

#### 테스트 단계
1. **WebSocket 연결**
   ```javascript
   // 브라우저 콘솔에서 확인
   window.websocketService.isConnected()
   ```

2. **음성 채널 참가**
   ```javascript
   // VoiceBar 컴포넌트에서 음성 채널 클릭
   // 또는 직접 호출
   const { joinVoiceChannel } = useVoiceChatSFU();
   await joinVoiceChannel('server-id', 'channel-id');
   ```

3. **마이크 권한 및 스트림 생성**
   - 브라우저에서 마이크 권한 요청 확인
   - 로컬 스트림 생성 확인

4. **SFU 세션 생성**
   - Cloudflare API 호출 확인
   - 세션 ID 생성 확인

5. **트랙 발행**
   - 로컬 트랙 SFU 업로드 확인
   - 트랙 ID 생성 확인

#### 예상 결과
- ✅ WebSocket 연결 성공
- ✅ 마이크 권한 획득
- ✅ 로컬 스트림 생성
- ✅ SFU 세션 생성
- ✅ 트랙 발행 성공
- ✅ UI에 음성 연결 상태 표시

---

### 🔥 Phase 2: 2명 사용자 양방향 음성 테스트

#### 테스트 목표
- 실제 오디오 스트림 전달 확인
- 트랙 구독 및 수신 검증
- Speaking Detection 동작 확인

#### 테스트 환경 준비
```bash
# 두 개의 브라우저 또는 시크릿 창 사용
# 다른 사용자 계정으로 로그인
```

#### 테스트 단계
1. **사용자 A 음성 채널 참가**
   - Phase 1 테스트 완료 확인

2. **사용자 B 음성 채널 참가**
   - 같은 채널에 참가
   - 사용자 A에게 참가 알림 확인

3. **자동 트랙 구독**
   ```javascript
   // 개발자 도구에서 확인
   // 사용자 A: 사용자 B의 트랙 자동 구독
   // 사용자 B: 사용자 A의 트랙 자동 구독
   ```

4. **오디오 스트림 수신**
   - 실제 음성 전달 테스트
   - 양방향 통신 확인

5. **Speaking Detection**
   - 말하는 사용자의 시각적 표시 확인
   - 실시간 볼륨 레벨 표시

6. **음소거 기능**
   - 마이크 음소거/해제
   - 상대방에게 상태 반영 확인

#### 예상 결과
- ✅ 상호 트랙 구독 성공
- ✅ 실시간 오디오 스트림 전달
- ✅ Speaking Detection 동작
- ✅ 음소거 상태 동기화
- ✅ 사용자 목록 실시간 업데이트

---

### 🔥 Phase 3: 다중 사용자 (3명 이상) 테스트

#### 테스트 목표
- 스케일링 검증 (최대 16명까지)
- 트랜시버 풀 관리 확인
- 성능 및 안정성 검증

#### 테스트 환경 준비
```bash
# 3-5개의 브라우저 인스턴스
# 또는 여러 기기 사용
```

#### 테스트 단계
1. **순차적 사용자 참가**
   - 사용자들이 하나씩 채널 참가
   - 각 참가 시 기존 사용자들에게 알림 확인

2. **전체 트랙 구독**
   - 모든 사용자가 서로의 트랙 구독
   - 트랜시버 풀 효율성 확인

3. **동시 발화 테스트**
   - 여러 사용자가 동시에 발화
   - 오디오 믹싱 품질 확인

4. **사용자 중간 이탈**
   - 일부 사용자가 채널 이탈
   - 트랙 정리 및 재배치 확인

5. **재참가 테스트**
   - 이탈한 사용자 재참가
   - 기존 연결에 영향 없는지 확인

#### 예상 결과
- ✅ 다중 사용자 동시 연결
- ✅ 트랜시버 풀 효율적 관리
- ✅ 오디오 품질 유지
- ✅ 동적 사용자 관리
- ✅ 메모리 및 연결 안정성

---

## 2. 성공 조건 정의

### WebSocket 연결 성공 조건
```javascript
// 확인 방법
console.log('WebSocket Status:', {
  connected: window.websocketService.isConnected(),
  socketId: window.websocketService.socket?.id,
  state: window.websocketService.getConnectionState()
});
```
- ✅ `connected: true`
- ✅ `socketId`가 존재
- ✅ 연결 에러 없음

### Cloudflare 세션 생성 성공 조건
```javascript
// useVoiceChatSFU 훅에서 확인
const { sfuSessionId, currentVoiceChannel } = useVoiceChatSFU();
console.log('SFU Status:', { sfuSessionId, currentVoiceChannel });
```
- ✅ `sfuSessionId`가 생성됨
- ✅ `currentVoiceChannel`이 설정됨
- ✅ Cloudflare API 호출 성공 (Backend 프록시)

### 트랙 발행/구독 성공 조건
```javascript
// 개발자 도구 Network 탭에서 확인
// 1. /api/v1/cloudflare/sessions/new (세션 생성)
// 2. /api/v1/cloudflare/sessions/{id}/tracks/new (트랙 발행)
// 3. 구독자들의 트랙 구독 요청
```
- ✅ HTTP 200 응답
- ✅ `trackId` 생성 확인
- ✅ WebRTC `ontrack` 이벤트 발생

### 실제 오디오 스트림 전달 확인
```javascript
// RemoteAudioPlayer 컴포넌트에서 확인
// 1. MediaStream 객체 존재
// 2. 오디오 트랙 활성화 상태
// 3. 실제 소리 출력
```
- ✅ `MediaStream.getAudioTracks().length > 0`
- ✅ `audioTrack.readyState === 'live'`
- ✅ 육안/청각으로 오디오 전달 확인

---

## 3. 디버깅을 위한 로깅 전략

### 프론트엔드 로깅 포인트

#### useVoiceChatSFU Hook
```javascript
// 주요 로깅 포인트 (이미 구현됨)
console.log('🎬 ========== SFU 음성 채널 참가 시작 ==========');
console.log('✅ 로컬 스트림 획득 완료');
console.log('✅ SFU 세션 생성 완료:', session.sessionId);
console.log('📡 원격 트랙 수신:', event.track);
console.log('✅ ========== SFU 음성 채널 참가 완료 ==========');
```

#### 추가 디버깅 도구
```javascript
// 브라우저 콘솔에서 사용 가능한 디버깅 함수들
window.debugVoice = {
  // 현재 상태 확인
  status: () => {
    const { voiceUsers, isVoiceConnected, currentVoiceChannel } = useAppStore.getState();
    console.table({
      connected: isVoiceConnected,
      channel: currentVoiceChannel,
      users: voiceUsers.length
    });
  },
  
  // 트랙 정보 확인
  tracks: () => {
    const pc = peerConnection.current;
    if (pc) {
      console.log('Transceivers:', pc.getTransceivers().map(t => ({
        direction: t.direction,
        mid: t.mid,
        kind: t.receiver.track?.kind
      })));
    }
  },
  
  // 연결 상태 확인
  connection: () => {
    const pc = peerConnection.current;
    if (pc) {
      console.log('Connection State:', pc.connectionState);
      console.log('ICE State:', pc.iceConnectionState);
      console.log('Gathering State:', pc.iceGatheringState);
    }
  }
};
```

### 백엔드 로깅 포인트

#### Cloudflare API 프록시 서비스
```javascript
// backend/routes/cloudflare.js
app.post('/api/v1/cloudflare/sessions/new', (req, res) => {
  console.log('📡 Cloudflare 세션 생성 요청:', req.body);
  // ... API 호출
  console.log('✅ Cloudflare 세션 응답:', response.data);
});

app.post('/api/v1/cloudflare/sessions/:sessionId/tracks/new', (req, res) => {
  console.log('📺 Cloudflare 트랙 발행 요청:', req.params.sessionId);
  console.log('📺 트랙 정보:', req.body);
  // ... API 호출
  console.log('✅ 트랙 발행 응답:', response.data);
});
```

### Signal Server 로깅 포인트

#### WebSocket 이벤트 로깅
```javascript
// docker/signal-server/index.js (이미 구현됨)
socket.on('voice:join', async (data) => {
  console.log(`✅ ${socket.user.username} 음성 채널 참가 완료: ${serverId}/${channelId}`);
});

socket.on('voice:leave', async (data) => {
  console.log(`🚪 ${socket.user.username} left voice channel: ${serverId}/${channelId}`);
});
```

#### VoiceStateManager 로깅
```javascript
// docker/signal-server/services/VoiceStateManager.js (이미 구현됨)
joinVoiceChannel(userId, username, serverId, channelId, socketId, trackId) {
  console.log(`🎤 ${username} joined voice channel: ${channelKey}`);
}

leaveAllVoiceChannels(userId) {
  console.log(`🚪 User ${userId} left voice channel: ${channelKey}`);
}
```

---

## 4. 문제 발생 시 트러블슈팅 가이드

### 일반적인 문제 및 해결방법

#### 1. WebSocket 연결 실패
**증상**: `websocketService.isConnected()` 가 `false`

**원인 분석**:
```bash
# Signal Server 상태 확인
curl http://localhost:4000/health

# 로그 확인
docker logs signal-server
```

**해결방법**:
1. Signal Server 재시작
2. JWT 토큰 확인
3. CORS 설정 점검

#### 2. 마이크 권한 거부
**증상**: `getUserMedia` 실패

**원인 분석**:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ 마이크 접근 성공'))
  .catch(error => console.error('❌ 마이크 접근 실패:', error));
```

**해결방법**:
1. 브라우저 설정에서 마이크 권한 허용
2. HTTPS 연결 확인 (HTTP에서는 제한됨)
3. 다른 브라우저에서 테스트

#### 3. SFU 세션 생성 실패
**증상**: Cloudflare API 호출 실패

**원인 분석**:
```bash
# Backend 로그 확인
docker logs backend

# Cloudflare API 키 확인
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_TURN_KEY_ID
```

**해결방법**:
1. Cloudflare 자격증명 재확인
2. Backend 프록시 서비스 상태 점검
3. 네트워크 연결 상태 확인

#### 4. 트랙 구독 실패
**증상**: 원격 오디오 수신 안됨

**원인 분석**:
```javascript
// 트랜시버 상태 확인
const pc = peerConnection.current;
pc.getTransceivers().forEach((t, i) => {
  console.log(`Transceiver ${i}:`, {
    direction: t.direction,
    mid: t.mid,
    track: t.receiver.track?.readyState
  });
});
```

**해결방법**:
1. 트랜시버 풀 상태 확인
2. WebRTC 연결 상태 점검
3. 방화벽/NAT 설정 확인

#### 5. 오디오 품질 문제
**증상**: 음성이 끊기거나 지연됨

**원인 분석**:
```javascript
// 연결 통계 확인
pc.getStats().then(stats => {
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
      console.log('Audio Stats:', {
        packetsLost: report.packetsLost,
        jitter: report.jitter,
        roundTripTime: report.roundTripTime
      });
    }
  });
});
```

**해결방법**:
1. 네트워크 대역폭 확인
2. 다른 TURN 서버 시도
3. 오디오 코덱 설정 조정

### 긴급 복구 절차

#### 전체 시스템 재시작
```bash
# Docker 컨테이너 재시작
docker-compose down
docker-compose up -d

# 프론트엔드 재시작
npm run dev
```

#### 캐시 및 상태 초기화
```javascript
// 브라우저에서 실행
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 5. 성능 모니터링

### 메트릭 수집
```javascript
// 성능 메트릭 수집 함수
const collectVoiceMetrics = () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    webrtc: {},
    memory: performance.memory,
    users: voiceUsers.length
  };
  
  if (peerConnection.current) {
    const pc = peerConnection.current;
    metrics.webrtc.connectionState = pc.connectionState;
    metrics.webrtc.iceConnectionState = pc.iceConnectionState;
    metrics.webrtc.transceivers = pc.getTransceivers().length;
  }
  
  return metrics;
};

// 주기적 모니터링
setInterval(() => {
  console.log('Voice Metrics:', collectVoiceMetrics());
}, 10000); // 10초마다
```

### 알림 시스템
```javascript
// 중요 이벤트 알림
const notifyVoiceEvent = (type, data) => {
  console.log(`🔔 Voice Event [${type}]:`, data);
  
  // 필요시 외부 모니터링 시스템에 전송
  if (window.analytics) {
    window.analytics.track('voice_event', { type, data });
  }
};
```

---

## 6. 자동화된 테스트 실행

### 기본 연결 테스트
```javascript
const runBasicVoiceTest = async () => {
  console.log('🧪 기본 음성 연결 테스트 시작...');
  
  try {
    // 1. WebSocket 연결 확인
    if (!websocketService.isConnected()) {
      throw new Error('WebSocket 연결되지 않음');
    }
    console.log('✅ WebSocket 연결 확인');
    
    // 2. 마이크 권한 확인
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✅ 마이크 권한 확인');
    
    // 3. 음성 채널 참가
    const { joinVoiceChannel } = useVoiceChatSFU();
    await joinVoiceChannel('test-server', 'test-channel');
    console.log('✅ 음성 채널 참가 완료');
    
    console.log('🎉 기본 음성 연결 테스트 성공!');
    return true;
    
  } catch (error) {
    console.error('❌ 기본 음성 연결 테스트 실패:', error);
    return false;
  }
};

// 테스트 실행
window.runVoiceTest = runBasicVoiceTest;
```

이 종합적인 테스트 가이드를 통해 음성 전달 기능의 모든 단계를 체계적으로 검증하고, 문제 발생 시 신속하게 대응할 수 있습니다.