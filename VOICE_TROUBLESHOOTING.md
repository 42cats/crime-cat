# 음성 전달 기능 트러블슈팅 가이드

## 🚨 긴급 상황 대응

### 즉시 실행 가능한 명령어들

```javascript
// 브라우저 콘솔에서 실행
// 1. 현재 상태 즉시 확인
voiceTestUtils.status()

// 2. 기본 연결 테스트
voiceTestUtils.runBasicTest()

// 3. 긴급 음성 세션 정리
voiceTestUtils.cleanup()

// 4. WebSocket 상태 확인
window.websocketService.isConnected()
window.websocketService.getConnectionState()
```

---

## 🔍 단계별 문제 진단

### 1단계: 기본 환경 점검

#### WebSocket 연결 확인
```javascript
// 연결 상태 확인
console.log('WebSocket Status:', {
  connected: window.websocketService.isConnected(),
  socketId: window.websocketService.socket?.id,
  url: window.websocketService.socket?.io?.uri
});

// 연결 실패 시
if (!window.websocketService.isConnected()) {
  // 재연결 시도
  window.websocketService.reconnect();
  
  // 5초 후 다시 확인
  setTimeout(() => {
    console.log('재연결 결과:', window.websocketService.isConnected());
  }, 5000);
}
```

#### JWT 토큰 확인
```javascript
// 토큰 존재 여부 확인
const checkAuthToken = async () => {
  try {
    const response = await fetch('/api/v1/auth/websocket-token', {
      credentials: 'include'
    });
    console.log('Token API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Token available:', !!data.token);
    }
  } catch (error) {
    console.error('Token check failed:', error);
  }
};
checkAuthToken();
```

#### 브라우저 권한 확인
```javascript
// 마이크 권한 상태 확인
navigator.permissions.query({ name: 'microphone' })
  .then(permission => {
    console.log('Microphone permission:', permission.state);
    
    if (permission.state === 'denied') {
      console.error('❌ 마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
    }
  });
```

### 2단계: SFU 연결 진단

#### Cloudflare API 상태 확인
```javascript
// TURN 자격증명 테스트
const testTurnCredentials = async () => {
  try {
    const response = await fetch('/api/v1/cloudflare/turn/credentials?userId=test', {
      credentials: 'include'
    });
    
    console.log('TURN API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('TURN Credentials:', {
        provider: data.provider,
        iceServersCount: data.iceServers?.length || 0
      });
    } else {
      const error = await response.text();
      console.error('TURN API Error:', error);
    }
  } catch (error) {
    console.error('TURN API Request Failed:', error);
  }
};
testTurnCredentials();
```

#### SFU 세션 생성 테스트
```javascript
// 더미 세션 생성 테스트
const testSFUSession = async () => {
  try {
    const dummyOffer = {
      type: 'offer',
      sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:test\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:0\r\na=sendonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=ssrc:1001 cname:test\r\n'
    };
    
    const response = await fetch('/api/v1/cloudflare/sessions/new', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionDescription: dummyOffer })
    });
    
    console.log('SFU Session API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('SFU Session Created:', data.sessionId);
    } else {
      const error = await response.text();
      console.error('SFU Session Error:', error);
    }
  } catch (error) {
    console.error('SFU Session Request Failed:', error);
  }
};
testSFUSession();
```

### 3단계: WebRTC 연결 진단

#### PeerConnection 상태 확인
```javascript
// WebRTC 연결 상태 상세 확인
const diagnosePeerConnection = () => {
  const pc = window.debugVoice?.peerConnection;
  if (!pc) {
    console.error('❌ PeerConnection이 존재하지 않습니다');
    return;
  }
  
  console.log('🔍 PeerConnection 진단:');
  console.table({
    'Connection State': pc.connectionState,
    'ICE Connection': pc.iceConnectionState,
    'ICE Gathering': pc.iceGatheringState,
    'Signaling State': pc.signalingState
  });
  
  // 트랜시버 상태
  const transceivers = pc.getTransceivers();
  console.log('🎛️ Transceivers:', transceivers.map(t => ({
    direction: t.direction,
    mid: t.mid,
    kind: t.receiver.track?.kind,
    readyState: t.receiver.track?.readyState
  })));
  
  // ICE candidates 확인
  pc.getStats().then(stats => {
    const candidates = [];
    stats.forEach(report => {
      if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
        candidates.push({
          type: report.type,
          candidateType: report.candidateType,
          protocol: report.protocol,
          address: report.address || report.ip
        });
      }
    });
    console.log('🧊 ICE Candidates:', candidates);
  });
};
diagnosePeerConnection();
```

#### 네트워크 연결 품질 확인
```javascript
// WebRTC 통계 수집
const checkConnectionQuality = async () => {
  const pc = window.debugVoice?.peerConnection;
  if (!pc) return;
  
  const stats = await pc.getStats();
  const audioStats = [];
  
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
      audioStats.push({
        type: 'inbound',
        packetsLost: report.packetsLost,
        packetsReceived: report.packetsReceived,
        jitter: report.jitter,
        audioLevel: report.audioLevel
      });
    }
    
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      audioStats.push({
        type: 'connection',
        currentRoundTripTime: report.currentRoundTripTime,
        availableOutgoingBitrate: report.availableOutgoingBitrate,
        localCandidateType: report.localCandidateType,
        remoteCandidateType: report.remoteCandidateType
      });
    }
  });
  
  console.log('📊 연결 품질 통계:', audioStats);
  
  // 패킷 손실률 계산
  const inboundStats = audioStats.find(s => s.type === 'inbound');
  if (inboundStats && inboundStats.packetsReceived > 0) {
    const lossRate = (inboundStats.packetsLost / 
      (inboundStats.packetsLost + inboundStats.packetsReceived)) * 100;
    console.log(`📉 패킷 손실률: ${lossRate.toFixed(2)}%`);
    
    if (lossRate > 5) {
      console.warn('⚠️ 높은 패킷 손실률 감지. 네트워크 상태를 확인해주세요.');
    }
  }
};
checkConnectionQuality();
```

---

## 🛠️ 일반적인 문제 해결법

### 문제 1: "WebSocket 연결 실패"

**증상**:
- `websocketService.isConnected()` 가 `false`
- 콘솔에 연결 에러 메시지

**해결 단계**:
```bash
# 1. Signal Server 상태 확인
curl http://localhost:4000/health

# 2. Docker 컨테이너 상태 확인
docker ps | grep signal-server
docker logs signal-server

# 3. 환경변수 확인
echo $VITE_SIGNAL_SERVER_URL
```

**해결법**:
```javascript
// A. 재연결 시도
window.websocketService.reconnect();

// B. 강제 재초기화 (극단적인 경우)
window.location.reload();
```

### 문제 2: "마이크 권한 거부됨"

**증상**:
- getUserMedia 호출 실패
- 브라우저에서 마이크 접근 차단 메시지

**해결 단계**:
1. **브라우저 설정 확인**:
   - Chrome: 주소창 좌측 자물쇠 아이콘 → 마이크 허용
   - Firefox: 주소창 좌측 방패 아이콘 → 권한 관리

2. **HTTPS 확인**:
   ```javascript
   console.log('Current protocol:', window.location.protocol);
   // HTTP에서는 마이크 접근이 제한됨
   ```

3. **다른 애플리케이션 점유 확인**:
   - 다른 화상회의 프로그램 종료
   - 브라우저의 다른 탭에서 마이크 사용 중단

### 문제 3: "SFU 세션 생성 실패"

**증상**:
- Cloudflare API 호출 실패 (400, 401, 500 에러)
- 콘솔에 "Session API Proxy Error" 메시지

**해결 단계**:
```bash
# 1. Backend 서버 상태 확인
curl http://localhost:8080/api/v1/health

# 2. 환경변수 확인
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_TURN_KEY_ID
echo $CLOUDFLARE_APP_ID

# 3. Backend 로그 확인
docker logs backend
```

**해결법**:
```javascript
// A. Backend 프록시 우회 테스트 (긴급시만)
const testDirectCloudflare = async () => {
  // 주의: 이 방법은 CORS 문제가 있을 수 있음
  console.warn('⚠️ 직접 API 호출은 프로덕션에서 사용하지 마세요');
};

// B. 폴백 STUN 서버로 테스트
const testWithPublicSTUN = () => {
  // voiceTestUtils는 폴백 STUN 서버를 자동으로 사용
  voiceTestUtils.runBasicTest();
};
```

### 문제 4: "트랙 구독 실패"

**증상**:
- 다른 사용자의 음성이 들리지 않음
- 콘솔에 "트랙 구독 실패" 메시지

**해결 단계**:
```javascript
// 1. 트랜시버 풀 상태 확인
window.debugVoice.tracks();

// 2. 원격 스트림 상태 확인
window.debugVoice.remoteStreams();

// 3. 수동 트랙 구독 재시도
const retryTrackSubscription = async () => {
  const voiceUsers = useAppStore.getState().voiceUsers;
  console.log('재구독할 사용자들:', voiceUsers);
  
  // 각 사용자의 트랙에 대해 재구독 시도
  for (const user of voiceUsers) {
    if (user.trackId && user.trackId !== publishedTrackId) {
      console.log(`🔄 ${user.username} 트랙 재구독 시도:`, user.trackId);
      // subscribeToRemoteTrack 함수는 Hook 내부에서만 접근 가능
    }
  }
};
```

### 문제 5: "오디오 품질 문제"

**증상**:
- 음성이 끊김, 로봇 음성, 지연
- 에코 또는 피드백 발생

**해결 단계**:
```javascript
// 1. 연결 품질 확인
checkConnectionQuality();

// 2. 오디오 설정 확인
const checkAudioSettings = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000
    }
  });
  
  const track = stream.getAudioTracks()[0];
  const settings = track.getSettings();
  console.log('오디오 설정:', settings);
  
  stream.getTracks().forEach(t => t.stop());
};
checkAudioSettings();

// 3. 시스템 오디오 장치 확인
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    console.log('사용 가능한 마이크:', audioInputs);
  });
```

**해결법**:
- 다른 마이크 장치 시도
- 브라우저 재시작
- 시스템 오디오 드라이버 업데이트

---

## 🚑 응급 복구 절차

### 전체 시스템 재시작
```bash
# 1. Docker 컨테이너 재시작
docker-compose down
docker-compose up -d

# 2. 프론트엔드 재시작
npm run dev

# 3. 브라우저 캐시 및 상태 초기화
```

```javascript
// 브라우저에서 실행
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 음성 세션만 재시작
```javascript
// 1. 긴급 정리
voiceTestUtils.cleanup();

// 2. 3초 대기
setTimeout(() => {
  // 3. 기본 테스트 재실행
  voiceTestUtils.runBasicTest();
}, 3000);
```

### 네트워크 문제 시 대안
```javascript
// 1. 다른 TURN 서버 시도 (설정에서)
// 2. 직접 P2P 연결 시도 (STUN만 사용)
const useSTUNOnly = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};
```

---

## 📋 로그 수집 가이드

### 중요한 로그 파일들
```bash
# Frontend (브라우저 콘솔)
- 모든 console.log, console.error 메시지
- Network 탭의 API 호출 결과
- WebRTC 내부 로그 (chrome://webrtc-internals/)

# Backend
docker logs backend > backend.log

# Signal Server
docker logs signal-server > signal-server.log

# Docker Compose
docker-compose logs > docker.log
```

### 로그 수집 스크립트
```javascript
// 브라우저에서 실행하여 상태 정보 수집
const collectDebugInfo = () => {
  const info = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    websocket: {
      connected: window.websocketService?.isConnected(),
      state: window.websocketService?.getConnectionState()
    },
    voice: window.debugVoice ? {
      status: 'Available - call debugVoice.status()'
    } : 'Not available',
    metrics: voiceTestUtils?.metrics()
  };
  
  console.log('🔍 Debug Info:', JSON.stringify(info, null, 2));
  
  // 클립보드에 복사 (최신 브라우저)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    console.log('📋 Debug info copied to clipboard');
  }
  
  return info;
};

// 실행
window.collectDebugInfo = collectDebugInfo;
```

---

## 🔍 고급 디버깅 도구

### Chrome WebRTC Internals
```
chrome://webrtc-internals/
```
- 실시간 WebRTC 연결 상태 모니터링
- ICE candidate 교환 과정 확인
- 오디오/비디오 통계 실시간 확인

### Network 탭 활용
1. 개발자 도구 → Network 탭
2. 필터: `cloudflare`, `websocket`, `api`
3. 실패한 요청의 상세 정보 확인

### 성능 모니터링
```javascript
// 5초마다 성능 메트릭 수집
const monitoring = voiceTestUtils.monitor(5000);

// 중단하려면
monitoring(); // 반환된 함수 호출
```

### 메모리 누수 확인
```javascript
// 메모리 사용량 모니터링
setInterval(() => {
  if (performance.memory) {
    const usage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    console.log(`💾 Memory: ${usage}MB`);
  }
}, 10000);
```

---

이 트러블슈팅 가이드를 통해 음성 전달 기능의 대부분의 문제를 해결할 수 있습니다. 문제가 지속되면 수집된 로그와 함께 개발팀에 문의하세요.