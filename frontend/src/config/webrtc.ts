// WebRTC Configuration

// 환경변수에서 TURN 서버 설정 가져오기 (디버깅용 로그 추가)
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'mystery-place';
const TURN_PASSWORD = import.meta.env.VITE_TURN_PASSWORD || 'mystery-place-secret';
const TURN_REALM = import.meta.env.VITE_TURN_REALM || 'localhost';
const TURN_SECRET = import.meta.env.VITE_TURN_SECRET || 'mystery-place-static-secret';

// 디버깅용 콘솔 로그 - 환경변수 및 설정 확인
console.log('🔍 ========== WebRTC 환경변수 확인 ==========');
console.log('📋 VITE_TURN_USERNAME:', import.meta.env.VITE_TURN_USERNAME, '(fallback:', TURN_USERNAME, ')');
console.log('🔑 VITE_TURN_PASSWORD:', import.meta.env.VITE_TURN_PASSWORD, '(fallback:', TURN_PASSWORD, ')');
console.log('🌐 VITE_TURN_REALM:', import.meta.env.VITE_TURN_REALM, '(fallback:', TURN_REALM, ')');
console.log('🔐 VITE_TURN_SECRET:', import.meta.env.VITE_TURN_SECRET, '(fallback:', TURN_SECRET, ')');
console.log('✅ 환경변수 로딩 완료');
console.log('=====================================');

// TURN 서버 시간 기반 인증 credential 생성 (static-auth-secret 방식)
function generateTurnCredentials() {
  // 현재 시간 + 1시간 (유효 기간)
  const timestamp = Math.floor(Date.now() / 1000) + 3600;
  const username = `${timestamp}:${TURN_USERNAME}`;
  
  // HMAC-SHA1으로 credential 생성
  const encoder = new TextEncoder();
  const data = encoder.encode(username);
  const key = encoder.encode(TURN_SECRET);
  
  return crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  ).then(cryptoKey => {
    return crypto.subtle.sign('HMAC', cryptoKey, data);
  }).then(signature => {
    const base64Credential = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return {
      username,
      credential: base64Credential
    };
  });
}

// 동적 ICE 서버 설정 함수
export async function getICEServers(): Promise<RTCConfiguration> {
  try {
    // TURN 서버 시간 기반 인증 사용
    const turnCredentials = await generateTurnCredentials();
    
    return {
      iceServers: [
        // Local TURN/STUN server (primary) - 시간 기반 인증
        {
          urls: ['stun:localhost:3478', 'turn:localhost:3478'],
          username: turnCredentials.username,
          credential: turnCredentials.credential
        },
        
        // Backup public STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      iceCandidatePoolSize: 10,
    };
  } catch (error) {
    console.warn('Failed to generate TURN credentials, using fallback:', error);
    
    // 실패 시 기본 인증 사용
    return {
      iceServers: [
        {
          urls: ['stun:localhost:3478', 'turn:localhost:3478'],
          username: TURN_USERNAME,
          credential: TURN_PASSWORD
        },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      iceCandidatePoolSize: 10,
    };
  }
}

// 안정적인 기본 인증 방식 사용 (권장)
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Local TURN/STUN server (primary) - 기본 long-term credential 인증
    {
      urls: ['stun:localhost:3478', 'turn:localhost:3478'],
      username: TURN_USERNAME,
      credential: TURN_PASSWORD
    },
    // TURN 테스트를 위한 추가 설정 (UDP/TCP 명시)
    {
      urls: ['turn:localhost:3478?transport=udp'],
      username: TURN_USERNAME,
      credential: TURN_PASSWORD
    },
    {
      urls: ['turn:localhost:3478?transport=tcp'],
      username: TURN_USERNAME,
      credential: TURN_PASSWORD
    },
    
    // Backup public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

// Audio constraints for voice chat
export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  },
  video: false
};

// For backward compatibility
export function getAudioConstraints(): MediaStreamConstraints {
  return AUDIO_CONSTRAINTS;
}

// 기본 username/password 인증 사용 (단순하고 안정적) - 권장 방식
export function getRTCConfiguration(): RTCConfiguration {
  console.log('');
  console.log('🔧 ========== WebRTC Configuration 생성 ==========');
  console.log('📡 Authentication Method: Basic Long-term Credentials');
  console.log('🌐 TURN Server URL: turn:localhost:3478');
  console.log('👤 Username:', TURN_USERNAME);
  console.log('🔑 Password:', TURN_PASSWORD ? '***' + TURN_PASSWORD.slice(-3) : 'NOT_SET');
  console.log('🏠 Realm:', TURN_REALM);
  console.log('');
  console.log('📋 Full ICE Servers Configuration:');
  console.log(JSON.stringify(ICE_SERVERS, null, 2));
  console.log('');
  console.log('✅ WebRTC Configuration 준비 완료');
  console.log('===========================================');
  console.log('');
  return ICE_SERVERS;
}

// 기본 설정을 기본값으로 사용 (long-term credentials)
export function getDefaultRTCConfiguration(): RTCConfiguration {
  return ICE_SERVERS;
}

// 동기적 호환성 함수 (deprecated)
export function getRTCConfigurationSync(): RTCConfiguration {
  return ICE_SERVERS;
}

// Helper function to create a new RTCPeerConnection with dynamic auth
export async function createPeerConnection(): Promise<RTCPeerConnection> {
  // Use basic authentication for now (simple and reliable)
  const config = ICE_SERVERS;
  const pc = new RTCPeerConnection(config);
  
  // Enable audio transceivers
  pc.addTransceiver('audio', { direction: 'sendrecv' });
  
  return pc;
}

// 동기적 PeerConnection 생성 (fallback)
export function createPeerConnectionSync(): RTCPeerConnection {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  
  // Enable audio transceivers
  pc.addTransceiver('audio', { direction: 'sendrecv' });
  
  return pc;
}

// Helper function to get user media
export async function getUserMedia(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    return stream;
  } catch (error) {
    console.error('Failed to get user media:', error);
    throw error;
  }
}