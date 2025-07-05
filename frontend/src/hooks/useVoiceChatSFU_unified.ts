import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService, { VoiceUser } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';
import cloudflareProxyService from '../services/cloudflareProxyService';

// Speaking Detection 유틸리티
class SpeakingDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;
  private onSpeakingChange: ((isSpeaking: boolean) => void) | null = null;
  private isSpeaking = false;
  private silenceThreshold = 30; // 음성 감지 임계값
  private speakingTimeout: NodeJS.Timeout | null = null;

  async initialize(stream: MediaStream, onSpeakingChange: (isSpeaking: boolean) => void) {
    try {
      this.onSpeakingChange = onSpeakingChange;
      
      // AudioContext 생성
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 스트림에서 오디오 소스 생성
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      
      // 분석기 노드 생성
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // 연결
      this.mediaStreamSource.connect(this.analyser);
      
      // 데이터 배열 생성
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      // 분석 시작
      this.startAnalysis();
      
      console.log('🎤 Speaking Detection 초기화 완료');
    } catch (error) {
      console.error('❌ Speaking Detection 초기화 실패:', error);
    }
  }

  private startAnalysis() {
    if (!this.analyser || !this.dataArray) return;

    const analyze = () => {
      if (!this.analyser || !this.dataArray) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      
      // 평균 볼륨 계산
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      
      const currentlyActive = average > this.silenceThreshold;
      
      if (currentlyActive !== this.isSpeaking) {
        this.isSpeaking = currentlyActive;
        
        if (this.speakingTimeout) {
          clearTimeout(this.speakingTimeout);
        }
        
        if (currentlyActive) {
          // 즉시 speaking 상태로 변경
          this.onSpeakingChange?.(true);
        } else {
          // 500ms 후에 speaking 중지 (노이즈 방지)
          this.speakingTimeout = setTimeout(() => {
            this.onSpeakingChange?.(false);
          }, 500);
        }
      }
      
      this.animationFrame = requestAnimationFrame(analyze);
    };

    analyze();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.audioContext = null;
    this.analyser = null;
    this.mediaStreamSource = null;
    this.dataArray = null;
    this.onSpeakingChange = null;
  }
}

/**
 * Phase 1 개선된 음성 채팅 훅
 * - 통합된 WebSocket 이벤트 리스너 (중복 제거)
 * - Signal Server를 단일 진실 소스로 사용
 * - 상태 구독 전용 모드
 */
export const useVoiceChatSFU = () => {
  // Zustand 스토어에서 전역 상태 가져오기
  const {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    currentVoiceChannel: globalCurrentVoiceChannel,
    setVoiceUsers,
    addVoiceUser,
    removeVoiceUser,
    setVoiceConnected,
    setLocalMuted,
    setCurrentVoiceChannel: setGlobalCurrentVoiceChannel
  } = useAppStore();
  
  // 실제 사용자 정보 가져오기
  const { currentUser } = useAppStore();
  const user = currentUser || { id: 'guest-user', username: '게스트' };

  // 글로벌 상태 사용 (로컬 상태 제거)
  const currentVoiceChannel = globalCurrentVoiceChannel;
  const setCurrentVoiceChannel = setGlobalCurrentVoiceChannel;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [trackId: string]: MediaStream }>({});
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteVolumes, setRemoteVolumes] = useState<{ [trackId: string]: number }>({});
  
  // SFU 관련 상태
  const [sfuSessionId, setSfuSessionId] = useState<string | null>(null);
  const [publishedTrackId, setPublishedTrackId] = useState<string | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const subscribedTracks = useRef<Set<string>>(new Set());
  
  // 클로저 캡처 문제 해결을 위한 ref 추가
  const sfuSessionIdRef = useRef<string | null>(null);
  const publishedTrackIdRef = useRef<string | null>(null);
  const voiceUsersRef = useRef<VoiceUser[]>([]);
  const currentVoiceChannelRef = useRef<{ serverId: string; channelId: string } | undefined>(undefined);
  
  // ref 값 동기화
  useEffect(() => {
    sfuSessionIdRef.current = sfuSessionId;
    publishedTrackIdRef.current = publishedTrackId;
    voiceUsersRef.current = voiceUsers;
    currentVoiceChannelRef.current = currentVoiceChannel;
  }, [sfuSessionId, publishedTrackId, voiceUsers, currentVoiceChannel]);
  
  // Speaking Detection
  const localSpeakingDetector = useRef<SpeakingDetector | null>(null);
  const remoteSpeakingDetectors = useRef<{ [trackId: string]: SpeakingDetector }>({});

  /**
   * Phase 1-2: 통합된 단일 WebSocket 이벤트 리스너
   * 모든 음성 관련 이벤트를 하나의 useEffect에서 처리하여 중복 제거
   */
  useEffect(() => {
    console.log('🎯 [Phase 1-2] 통합 WebSocket 이벤트 리스너 등록 시작');

    // 1. voice:join:success - 음성 채널 참가 성공
    const joinSuccessHandler = (data: any) => {
      console.log('🎯 [Phase 1] Voice join success:', data);
      
      // Signal Server가 제공하는 사용자 목록을 단일 진실 소스로 사용
      if (data.currentUsers && Array.isArray(data.currentUsers)) {
        console.log('👥 [Phase 1] Signal Server 사용자 목록 수신:', data.currentUsers.length, '명');
        setVoiceUsers(data.currentUsers); // 상태 덮어쓰기 (Signal Server가 진실 소스)
        
        // 원격 트랙 구독
        data.currentUsers.forEach((user: any) => {
          if (user.trackId && user.id !== user.id && user.sessionId) {
            subscribeToRemoteTrack(user.trackId, user.sessionId);
          }
        });
      }
    };

    // 2. voice:user-joined - 새 사용자 참가
    const userJoinedHandler = (user: VoiceUser) => {
      console.log('🔔 [Phase 1] 새 사용자 참가:', user.username);
      
      // Signal Server에서 오는 이벤트를 그대로 신뢰
      addVoiceUser(user);
      
      // 원격 트랙 구독
      if (user.trackId && user.sessionId) {
        subscribeToRemoteTrack(user.trackId, user.sessionId);
      }
    };

    // 3. voice:user-left - 사용자 퇴장
    const userLeftHandler = (user: VoiceUser) => {
      console.log('👋 [Phase 1] 사용자 퇴장:', user.username);
      
      // 트랙 정리
      if (user.trackId) {
        setRemoteStreams(prev => {
          const updated = { ...prev };
          delete updated[user.trackId!];
          return updated;
        });
        subscribedTracks.current.delete(user.trackId);
      }
      
      // Signal Server에서 오는 이벤트를 그대로 신뢰
      removeVoiceUser(user.id || user.userId || '');
    };

    // 4. voice:state:updated - 전체 상태 업데이트
    const stateUpdateHandler = (data: { serverId: string; channelId: string; users: VoiceUser[] }) => {
      console.log('🔄 [Phase 1] Signal Server 상태 업데이트:', data.users.length, '명');
      
      // Signal Server가 단일 진실 소스이므로 전체 상태를 덮어쓰기
      setVoiceUsers(data.users);
    };

    // 5. voice:speaking:updated - Speaking 상태 업데이트
    const speakingHandler = (data: { userId: string; isSpeaking: boolean }) => {
      setVoiceUsers(prevUsers => 
        prevUsers.map(user => 
          user.userId === data.userId || user.id === data.userId
            ? { ...user, isSpeaking: data.isSpeaking }
            : user
        )
      );
    };

    // 6. voice:users:received - 사용자 목록 수신
    const usersReceivedHandler = (data: { serverId: string; channelId: string; users: VoiceUser[] }) => {
      console.log('📋 [Phase 1] Signal Server 사용자 목록 수신:', data.users.length, '명');
      
      // Signal Server가 단일 진실 소스이므로 전체 상태를 덮어쓰기
      setVoiceUsers(data.users);
    };

    // 이벤트 리스너 등록
    websocketService.on('voice:join:success', joinSuccessHandler);
    websocketService.on('voice:user-joined', userJoinedHandler);
    websocketService.on('voice:user-left', userLeftHandler);
    websocketService.on('voice:state:updated', stateUpdateHandler);
    websocketService.on('voice:speaking:updated', speakingHandler);
    websocketService.on('voice:users:received', usersReceivedHandler);
    
    console.log('✅ [Phase 1-2] 통합 WebSocket 이벤트 리스너 등록 완료');
    
    // 정리 함수 - 모든 리스너를 한 번에 정리
    return () => {
      console.log('🧹 [Phase 1-2] 통합 WebSocket 이벤트 리스너 정리 시작');
      websocketService.off('voice:join:success', joinSuccessHandler);
      websocketService.off('voice:user-joined', userJoinedHandler);
      websocketService.off('voice:user-left', userLeftHandler);
      websocketService.off('voice:state:updated', stateUpdateHandler);
      websocketService.off('voice:speaking:updated', speakingHandler);
      websocketService.off('voice:users:received', usersReceivedHandler);
      console.log('✅ [Phase 1-2] 통합 WebSocket 이벤트 리스너 정리 완료');
    };
  }, []); // 의존성 배열 비움 - 한 번만 등록

  // 나머지 기능들은 기존과 동일하게 유지...
  // (RTCPeerConnection, SFU 관련 로직 등)

  /**
   * 음성 채널 참가
   */
  const joinVoiceChannel = useCallback(async (serverId: string, channelId: string) => {
    try {
      console.log('🎤 [Phase 1] 음성 채널 참가 시작:', serverId, channelId);
      
      // 1. 로컬 스트림 생성
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      setLocalStream(stream);
      setCurrentVoiceChannel({ serverId, channelId });
      setVoiceConnected(true);
      
      // 2. WebSocket을 통해 Signal Server에 참가 알림
      websocketService.joinVoiceChannel(serverId, channelId);
      
      console.log('✅ [Phase 1] 음성 채널 참가 완료');
      
    } catch (error) {
      console.error('❌ [Phase 1] 음성 채널 참가 실패:', error);
      throw error;
    }
  }, [setCurrentVoiceChannel, setVoiceConnected]);

  /**
   * 음성 채널 퇴장
   */
  const leaveVoiceChannel = useCallback(() => {
    console.log('🚪 [Phase 1] 음성 채널 퇴장 시작');
    
    // 1. 로컬 스트림 정리
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // 2. WebSocket을 통해 Signal Server에 퇴장 알림
    if (currentVoiceChannel) {
      websocketService.leaveVoiceChannel(currentVoiceChannel.serverId, currentVoiceChannel.channelId);
    }
    
    // 3. 상태 정리
    setCurrentVoiceChannel(undefined);
    setVoiceConnected(false);
    setVoiceUsers([]); // 로컬 상태 정리
    
    console.log('✅ [Phase 1] 음성 채널 퇴장 완료');
  }, [localStream, currentVoiceChannel, setCurrentVoiceChannel, setVoiceConnected, setVoiceUsers]);

  /**
   * 음소거 토글
   */
  const toggleMute = useCallback(() => {
    const newMuted = !localMuted;
    setLocalMuted(newMuted);
    
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
    }
    
    // Signal Server에 상태 업데이트
    if (currentVoiceChannel) {
      websocketService.updateVoiceStatus(
        currentVoiceChannel.serverId,
        currentVoiceChannel.channelId,
        { isMuted: newMuted }
      );
    }
    
    console.log('🔇 [Phase 1] 음소거 토글:', newMuted ? '음소거' : '음소거 해제');
  }, [localMuted, localStream, currentVoiceChannel, setLocalMuted]);

  // 임시로 기본 SFU 함수들을 스텁으로 제공
  const subscribeToRemoteTrack = useCallback(async (trackId: string, sessionId: string) => {
    console.log('📡 [Phase 1] 원격 트랙 구독 (스텁):', trackId);
    // TODO: SFU 구독 로직 구현
  }, []);

  return {
    // 상태
    currentVoiceChannel,
    voiceUsers,
    isVoiceConnected,
    localMuted,
    localSpeaking,
    localStream,
    remoteStreams,
    remoteVolumes,
    
    // 액션
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    
    // SFU 관련 (Phase 2에서 구현)
    sfuSessionId,
    publishedTrackId,
  };
};

export default useVoiceChatSFU;