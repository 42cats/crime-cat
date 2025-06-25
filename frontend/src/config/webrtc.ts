// WebRTC Configuration - Simplified for Backend Proxy Architecture

// 폴백용 STUN 서버 설정 (공개 서버만)
export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
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

// 기본 RTC 설정 반환 (폴백용)
export function getDefaultRTCConfiguration(): RTCConfiguration {
  return ICE_SERVERS;
}

// 동기적 호환성 함수 (하위 호환성)
export function getRTCConfigurationSync(): RTCConfiguration {
  return ICE_SERVERS;
}

// Helper function to get user media
export async function getUserMedia(): Promise<MediaStream> {
  try {
    console.log('🎤 사용자 미디어 스트림 요청 중...');
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    console.log('✅ 사용자 미디어 스트림 획득 성공');
    return stream;
  } catch (error) {
    console.error('❌ 사용자 미디어 스트림 획득 실패:', error);
    throw error;
  }
}

// NOTE: 
// - Cloudflare TURN 자격증명은 이제 Backend 프록시 서비스(cloudflareProxyService)에서 처리
// - 직접 API 호출 로직은 보안상 제거됨
// - 이 파일은 폴백 설정과 기본 미디어 제약조건만 제공