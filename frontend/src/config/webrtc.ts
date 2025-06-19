// WebRTC Configuration

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional STUN servers for better connectivity
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    
    // TURN server (if available) - uncomment and configure as needed
    // {
    //   urls: 'turn:localhost:3478',
    //   username: 'user',
    //   credential: 'password'
    // }
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

export function getRTCConfiguration(): RTCConfiguration {
  return ICE_SERVERS;
}

// Helper function to create a new RTCPeerConnection
export function createPeerConnection(): RTCPeerConnection {
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