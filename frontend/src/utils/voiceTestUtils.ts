/**
 * 음성 전달 기능 테스트 유틸리티
 * 개발자 콘솔에서 사용할 수 있는 디버깅 및 테스트 도구들
 */

import { useAppStore } from '../store/useAppStore';
import websocketService from '../services/websocketService';

export interface VoiceTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export interface VoiceMetrics {
  timestamp: string;
  webrtc: {
    connectionState?: RTCPeerConnectionState;
    iceConnectionState?: RTCIceConnectionState;
    iceGatheringState?: RTCIceGatheringState;
    transceivers: number;
    activeTransceivers: number;
    inactiveTransceivers: number;
  };
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  voice: {
    connected: boolean;
    users: number;
    currentChannel?: {
      serverId: string;
      channelId: string;
    };
    localMuted: boolean;
    localSpeaking: boolean;
  };
  websocket: {
    connected: boolean;
    socketId?: string;
  };
}

/**
 * 기본 음성 연결 테스트
 */
export const runBasicVoiceTest = async (): Promise<VoiceTestResult> => {
  console.log('🧪 기본 음성 연결 테스트 시작...');
  
  try {
    const results: string[] = [];
    
    // 1. WebSocket 연결 확인
    if (!websocketService.isConnected()) {
      throw new Error('WebSocket이 연결되지 않았습니다');
    }
    results.push('✅ WebSocket 연결 확인');
    
    // 2. 마이크 권한 확인
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // 스트림이 활성 상태인지 확인
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('오디오 트랙이 없습니다');
      }
      
      const activeTrack = audioTracks[0];
      if (activeTrack.readyState !== 'live') {
        throw new Error(`오디오 트랙 상태가 올바르지 않습니다: ${activeTrack.readyState}`);
      }
      
      results.push(`✅ 마이크 권한 및 스트림 생성 성공 (${audioTracks.length}개 트랙)`);
      
      // 테스트 후 스트림 정리
      stream.getTracks().forEach(track => track.stop());
      
    } catch (micError: any) {
      throw new Error(`마이크 접근 실패: ${micError.message}`);
    }
    
    // 3. 앱 상태 확인
    const appState = useAppStore.getState();
    if (!appState.currentUser) {
      console.warn('⚠️ 현재 사용자 정보가 없습니다 (게스트 모드)');
      results.push('⚠️ 게스트 모드로 실행');
    } else {
      results.push(`✅ 사용자 인증 확인: ${appState.currentUser.username}`);
    }
    
    // 4. Backend 연결 확인
    try {
      const response = await fetch('/api/v1/auth/websocket-token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        results.push('✅ Backend API 연결 확인');
      } else {
        results.push('⚠️ Backend API 응답 이상 (토큰 API)');
      }
    } catch (apiError) {
      results.push('⚠️ Backend API 연결 불가');
    }
    
    console.log('🎉 기본 음성 연결 테스트 성공!');
    results.forEach(result => console.log(result));
    
    return {
      success: true,
      message: '기본 음성 연결 테스트 통과',
      details: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    const errorMessage = `기본 음성 연결 테스트 실패: ${error.message}`;
    console.error('❌', errorMessage);
    
    return {
      success: false,
      message: errorMessage,
      details: error,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 음성 채널 참가 테스트
 */
export const runVoiceChannelJoinTest = async (
  serverId: string = 'test-server',
  channelId: string = 'test-channel'
): Promise<VoiceTestResult> => {
  console.log(`🧪 음성 채널 참가 테스트 시작: ${serverId}/${channelId}`);
  
  try {
    // useVoiceChatSFU 훅은 React 컴포넌트 외부에서 직접 사용할 수 없으므로
    // 윈도우 객체를 통해 접근하는 방식 사용
    if (!(window as any).testVoiceJoin) {
      throw new Error('testVoiceJoin 함수가 윈도우 객체에 노출되지 않았습니다. React 컴포넌트에서 설정해주세요.');
    }
    
    const result = await (window as any).testVoiceJoin(serverId, channelId);
    
    return {
      success: true,
      message: '음성 채널 참가 테스트 성공',
      details: result,
      timestamp: new Date().toISOString()
    };
    
  } catch (error: any) {
    const errorMessage = `음성 채널 참가 테스트 실패: ${error.message}`;
    console.error('❌', errorMessage);
    
    return {
      success: false,
      message: errorMessage,
      details: error,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 현재 음성 상태 수집
 */
export const collectVoiceMetrics = (): VoiceMetrics => {
  const appState = useAppStore.getState();
  
  // WebRTC PeerConnection 상태 수집
  let webrtcMetrics = {
    transceivers: 0,
    activeTransceivers: 0,
    inactiveTransceivers: 0
  };
  
  // 전역 peerConnection 확인 (실제 구현에서는 React 컨텍스트를 통해 접근해야 함)
  const pc = (window as any).debugVoice?.peerConnection;
  if (pc && pc instanceof RTCPeerConnection) {
    const transceivers = pc.getTransceivers();
    webrtcMetrics = {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      transceivers: transceivers.length,
      activeTransceivers: transceivers.filter(t => t.direction !== 'inactive').length,
      inactiveTransceivers: transceivers.filter(t => t.direction === 'inactive').length
    };
  }
  
  // 메모리 사용량 수집
  const memoryMetrics = (performance as any).memory ? {
    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
  } : {};
  
  return {
    timestamp: new Date().toISOString(),
    webrtc: webrtcMetrics,
    memory: memoryMetrics,
    voice: {
      connected: appState.isVoiceConnected,
      users: appState.voiceUsers.length,
      currentChannel: appState.currentVoiceChannel,
      localMuted: appState.localMuted,
      localSpeaking: false // Speaking 상태는 Hook에서만 접근 가능
    },
    websocket: {
      connected: websocketService.isConnected(),
      socketId: (websocketService as any).socket?.id
    }
  };
};

/**
 * WebRTC 연결 통계 수집
 */
export const collectWebRTCStats = async (): Promise<any> => {
  const pc = (window as any).debugVoice?.peerConnection;
  if (!pc || !(pc instanceof RTCPeerConnection)) {
    throw new Error('PeerConnection을 찾을 수 없습니다');
  }
  
  const stats = await pc.getStats();
  const audioStats: any[] = [];
  
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
      audioStats.push({
        type: 'inbound-audio',
        packetsLost: report.packetsLost,
        packetsReceived: report.packetsReceived,
        bytesReceived: report.bytesReceived,
        jitter: report.jitter,
        audioLevel: report.audioLevel,
        timestamp: report.timestamp
      });
    } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
      audioStats.push({
        type: 'outbound-audio',
        packetsSent: report.packetsSent,
        bytesSent: report.bytesSent,
        timestamp: report.timestamp
      });
    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      audioStats.push({
        type: 'connection',
        currentRoundTripTime: report.currentRoundTripTime,
        availableOutgoingBitrate: report.availableOutgoingBitrate,
        state: report.state
      });
    }
  });
  
  return audioStats;
};

/**
 * 음성 시스템 상태 요약 출력
 */
export const printVoiceStatus = (): void => {
  console.log('🔍 ========== 음성 시스템 상태 ==========');
  
  const metrics = collectVoiceMetrics();
  
  console.table({
    'WebSocket 연결': metrics.websocket.connected ? '✅ 연결됨' : '❌ 연결 끊김',
    'Socket ID': metrics.websocket.socketId || '없음',
    '음성 연결': metrics.voice.connected ? '✅ 연결됨' : '❌ 연결 끊김',
    '현재 채널': metrics.voice.currentChannel 
      ? `${metrics.voice.currentChannel.serverId}/${metrics.voice.currentChannel.channelId}`
      : '없음',
    '음성 사용자 수': metrics.voice.users,
    '로컬 음소거': metrics.voice.localMuted ? '🔇 음소거' : '🎤 음소거 해제',
    'WebRTC 상태': metrics.webrtc.connectionState || '알 수 없음',
    'ICE 연결': metrics.webrtc.iceConnectionState || '알 수 없음',
    '트랜시버 총 개수': metrics.webrtc.transceivers,
    '활성 트랜시버': metrics.webrtc.activeTransceivers,
    '비활성 트랜시버': metrics.webrtc.inactiveTransceivers
  });
  
  if (metrics.memory.usedJSHeapSize) {
    const memoryMB = Math.round(metrics.memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round((metrics.memory.totalJSHeapSize || 0) / 1024 / 1024);
    console.log(`💾 메모리 사용량: ${memoryMB}MB / ${totalMB}MB`);
  }
  
  console.log('==========================================');
};

/**
 * 트랜시버 상태 상세 출력
 */
export const printTransceiverStatus = (): void => {
  const pc = (window as any).debugVoice?.peerConnection;
  if (!pc || !(pc instanceof RTCPeerConnection)) {
    console.error('❌ PeerConnection을 찾을 수 없습니다');
    return;
  }
  
  console.log('🎛️ ========== 트랜시버 상태 ==========');
  
  const transceivers = pc.getTransceivers();
  transceivers.forEach((transceiver, index) => {
    const track = transceiver.receiver.track;
    console.log(`Transceiver ${index}:`, {
      mid: transceiver.mid,
      direction: transceiver.direction,
      kind: track?.kind,
      trackId: track?.id,
      readyState: track?.readyState,
      enabled: track?.enabled,
      muted: track?.muted
    });
  });
  
  console.log('==========================================');
};

/**
 * 음성 이벤트 모니터링 시작
 */
export const startVoiceMonitoring = (intervalMs: number = 10000): () => void => {
  console.log(`📊 음성 모니터링 시작 (${intervalMs}ms 간격)`);
  
  const interval = setInterval(() => {
    const metrics = collectVoiceMetrics();
    console.log('📊 Voice Metrics:', {
      timestamp: metrics.timestamp,
      connected: metrics.voice.connected,
      users: metrics.voice.users,
      webrtc: metrics.webrtc.connectionState,
      memory: metrics.memory.usedJSHeapSize 
        ? `${Math.round(metrics.memory.usedJSHeapSize / 1024 / 1024)}MB`
        : 'N/A'
    });
  }, intervalMs);
  
  return () => {
    clearInterval(interval);
    console.log('📊 음성 모니터링 중단');
  };
};

/**
 * 긴급 음성 세션 정리
 */
export const emergencyVoiceCleanup = (): void => {
  console.log('🚨 긴급 음성 세션 정리 시작...');
  
  try {
    // 전역 정리 함수 호출 (React 컴포넌트에서 설정해야 함)
    if ((window as any).emergencyVoiceCleanup) {
      (window as any).emergencyVoiceCleanup();
      console.log('✅ 음성 세션 정리 완료');
    } else {
      console.warn('⚠️ emergencyVoiceCleanup 함수를 찾을 수 없습니다');
    }
    
    // WebSocket 재연결
    if (!websocketService.isConnected()) {
      websocketService.reconnect();
      console.log('🔄 WebSocket 재연결 시도');
    }
    
  } catch (error) {
    console.error('❌ 긴급 정리 중 오류:', error);
  }
};

// 전역 객체에 테스트 도구들 노출 (개발 모드)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).voiceTestUtils = {
    runBasicTest: runBasicVoiceTest,
    runJoinTest: runVoiceChannelJoinTest,
    status: printVoiceStatus,
    transceivers: printTransceiverStatus,
    metrics: collectVoiceMetrics,
    stats: collectWebRTCStats,
    monitor: startVoiceMonitoring,
    cleanup: emergencyVoiceCleanup
  };
  
  console.log('🧪 Voice Test Utils가 window.voiceTestUtils로 노출되었습니다');
  console.log('사용법:');
  console.log('  voiceTestUtils.runBasicTest() - 기본 연결 테스트');
  console.log('  voiceTestUtils.status() - 현재 상태 확인');
  console.log('  voiceTestUtils.transceivers() - 트랜시버 상태');
  console.log('  voiceTestUtils.monitor(5000) - 5초마다 모니터링');
  console.log('  voiceTestUtils.cleanup() - 긴급 정리');
}

export default {
  runBasicVoiceTest,
  runVoiceChannelJoinTest,
  collectVoiceMetrics,
  collectWebRTCStats,
  printVoiceStatus,
  printTransceiverStatus,
  startVoiceMonitoring,
  emergencyVoiceCleanup
};