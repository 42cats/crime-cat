// WebRTC configuration
export const webrtcConfig = {
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Alternative STUN servers
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    
    // TURN server configuration (if available)
    // Uncomment and configure if you have a TURN server
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ],
  
  // Optional configuration for better performance
  iceCandidatePoolSize: 10,
  
  // Audio constraints
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2
  }
};

// Get RTCPeerConnection configuration
export const getRTCConfiguration = (): RTCConfiguration => {
  return {
    iceServers: webrtcConfig.iceServers,
    iceCandidatePoolSize: webrtcConfig.iceCandidatePoolSize
  };
};

// Get audio constraints
export const getAudioConstraints = (): MediaStreamConstraints => {
  return {
    audio: webrtcConfig.audioConstraints,
    video: false
  };
};