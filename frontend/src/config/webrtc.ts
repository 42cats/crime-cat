// WebRTC Configuration - Cloudflare Realtime SFU + TURN

// Cloudflare 환경변수 설정 확인
const CF_ACCOUNT_ID = import.meta.env.VITE_CF_ACCOUNT_ID;
const CF_REALTIME_APP_ID = import.meta.env.VITE_CF_REALTIME_APP_ID;
const CF_TURN_KEY_ID = import.meta.env.VITE_CF_TURN_KEY_ID;
const SIGNAL_SERVER_URL = import.meta.env.VITE_SIGNAL_SERVER_URL || 'http://localhost:4000';

// 디버깅용 콘솔 로그 - Cloudflare 환경변수 확인
console.log('🔍 ========== Cloudflare WebRTC 환경변수 확인 ==========');
console.log('🏢 CF_ACCOUNT_ID:', CF_ACCOUNT_ID ? '설정됨' : '미설정');
console.log('📡 CF_REALTIME_APP_ID:', CF_REALTIME_APP_ID ? '설정됨' : '미설정');
console.log('🔑 CF_TURN_KEY_ID:', CF_TURN_KEY_ID ? '설정됨' : '미설정');
console.log('🌐 SIGNAL_SERVER_URL:', SIGNAL_SERVER_URL);
console.log('✅ Cloudflare 환경변수 로딩 완료');
console.log('=================================================');

// =============================================================================
// Cloudflare TURN 자격증명 API 호출
// =============================================================================

/**
 * Cloudflare TURN API에서 직접 자격증명 가져오기
 */
async function fetchCloudflareCredentials(userId: string, channelId: string) {
  try {
    console.log(`🔑 Cloudflare TURN 자격증명 직접 요청 중... (User: ${userId}, Channel: ${channelId})`);
    
    if (!CF_TURN_KEY_ID) {
      throw new Error('CF_TURN_KEY_ID 환경변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${CF_TURN_KEY_ID}/credentials/generate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_CF_TURN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ttl: 86400, // 24시간
          customIdentifier: userId
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Cloudflare TURN 자격증명 직접 수신 성공');
    console.log('📊 Provider: cloudflare');
    console.log('🌐 ICE Servers:', result.iceServers?.length || 0, '개');
    
    return {
      success: true,
      provider: 'cloudflare',
      iceServers: result.iceServers || [],
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString()
    };
    
  } catch (error) {
    console.error('❌ Cloudflare TURN 자격증명 직접 요청 실패:', error.message);
    throw error;
  }
}

/**
 * 통합 WebRTC 설정 가져오기 (Cloudflare TURN + SFU)
 */
export async function fetchWebRTCConfiguration(userId: string, channelId: string): Promise<any> {
  try {
    console.log(`🔧 통합 WebRTC 설정 요청 중... (User: ${userId}, Channel: ${channelId})`);
    
    const response = await fetch(
      `${SIGNAL_SERVER_URL}/api/webrtc/configuration?userId=${encodeURIComponent(userId)}&channelId=${encodeURIComponent(channelId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'WebRTC 설정 생성 실패');
    }

    console.log('✅ 통합 WebRTC 설정 수신 성공');
    console.log('📊 Provider:', result.data.provider);
    console.log('🎬 Realtime SFU:', result.data.realtime.enabled ? '활성화' : '비활성화');
    
    return result.data;
    
  } catch (error) {
    console.error('❌ 통합 WebRTC 설정 요청 실패:', error.message);
    throw error;
  }
}

// 동적 ICE 서버 설정 함수 (Cloudflare TURN 사용)
export async function getICEServers(userId: string = 'anonymous', channelId: string = 'default'): Promise<RTCConfiguration> {
  try {
    // Cloudflare TURN 자격증명 가져오기
    const credentials = await fetchCloudflareCredentials(userId, channelId);
    
    return {
      iceServers: credentials.iceServers,
      iceCandidatePoolSize: 10,
    };
    
  } catch (error) {
    console.warn('❌ Cloudflare TURN 자격증명 실패, 공개 STUN 서버 사용:', error.message);
    
    // 폴백: 공개 STUN 서버만 사용
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ],
      iceCandidatePoolSize: 10,
    };
  }
}

// 기본 ICE 서버 설정 (폴백용 - 공개 STUN 서버만)
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // 공개 STUN 서버들 (Cloudflare TURN 실패 시 폴백)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' }
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

// Cloudflare 기반 WebRTC 설정 생성 (권장 방식)
export async function getRTCConfiguration(userId: string = 'anonymous', channelId: string = 'default'): Promise<RTCConfiguration> {
  console.log('');
  console.log('🔧 ========== Cloudflare WebRTC Configuration 생성 ==========');
  console.log('🏢 Account ID:', CF_ACCOUNT_ID ? '설정됨' : '미설정');
  console.log('📡 Realtime App ID:', CF_REALTIME_APP_ID ? '설정됨' : '미설정');
  console.log('🔑 TURN Key ID:', CF_TURN_KEY_ID ? '설정됨' : '미설정');
  console.log('👤 User ID:', userId);
  console.log('📺 Channel ID:', channelId);
  console.log('');
  
  try {
    const config = await getICEServers(userId, channelId);
    
    console.log('📋 ICE Servers Configuration:');
    console.log('🌐 Total ICE Servers:', config.iceServers.length);
    config.iceServers.forEach((server, index) => {
      console.log(`   ${index + 1}. URLs:`, Array.isArray(server.urls) ? server.urls.length + ' 개' : '1 개');
      console.log(`      Auth:`, server.username ? '인증됨' : '인증 없음');
    });
    console.log('');
    console.log('✅ Cloudflare WebRTC Configuration 준비 완료');
    console.log('===========================================');
    console.log('');
    
    return config;
    
  } catch (error) {
    console.warn('❌ Cloudflare 설정 실패, 기본 설정 사용:', error.message);
    console.log('📋 Fallback ICE Servers:', ICE_SERVERS.iceServers.length, '개');
    console.log('===========================================');
    
    return ICE_SERVERS;
  }
}

// 기본 설정을 기본값으로 사용 (long-term credentials)
export function getDefaultRTCConfiguration(): RTCConfiguration {
  return ICE_SERVERS;
}

// 동기적 호환성 함수 (deprecated)
export function getRTCConfigurationSync(): RTCConfiguration {
  return ICE_SERVERS;
}

// Helper function to create a new RTCPeerConnection with Cloudflare TURN
export async function createPeerConnection(userId: string = 'anonymous', channelId: string = 'default'): Promise<RTCPeerConnection> {
  try {
    // Cloudflare TURN 자격증명을 사용한 설정
    const config = await getRTCConfiguration(userId, channelId);
    const pc = new RTCPeerConnection(config);
    
    // Enable audio transceivers
    pc.addTransceiver('audio', { direction: 'sendrecv' });
    
    console.log('✅ RTCPeerConnection 생성 완료 (Cloudflare TURN)');
    return pc;
    
  } catch (error) {
    console.warn('❌ Cloudflare RTCPeerConnection 생성 실패, 폴백 사용:', error.message);
    return createPeerConnectionSync();
  }
}

// 동기적 PeerConnection 생성 (폴백용)
export function createPeerConnectionSync(): RTCPeerConnection {
  console.log('🔄 폴백: 기본 RTCPeerConnection 생성 (공개 STUN만)');
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