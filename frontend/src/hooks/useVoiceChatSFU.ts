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
      
      // 주파수 데이터 가져오기
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // 평균 볼륨 계산
      const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
      
      // 음성 감지
      const currentlySpeaking = average > this.silenceThreshold;
      
      // 상태 변경 감지
      if (currentlySpeaking !== this.isSpeaking) {
        this.isSpeaking = currentlySpeaking;
        
        if (currentlySpeaking) {
          // 말하기 시작
          if (this.speakingTimeout) {
            clearTimeout(this.speakingTimeout);
            this.speakingTimeout = null;
          }
          this.onSpeakingChange?.(true);
        } else {
          // 말하기 중단 (약간의 지연 후)
          this.speakingTimeout = setTimeout(() => {
            this.onSpeakingChange?.(false);
            this.speakingTimeout = null;
          }, 500); // 500ms 지연
        }
      }
      
      this.animationFrame = requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  getCurrentVolume(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = null;
    }
    
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.onSpeakingChange = null;
    
    console.log('🎤 Speaking Detection 종료');
  }
}

export interface UseVoiceChatSFUReturn {
  voiceUsers: VoiceUser[];
  isVoiceConnected: boolean;
  localMuted: boolean;
  localSpeaking: boolean;
  currentVoiceChannel?: { serverId: string; channelId: string };
  localStream: MediaStream | null;
  remoteStreams: { [trackId: string]: MediaStream };
  remoteVolumes: { [trackId: string]: number };
  joinVoiceChannel: (serverId: string, channelId: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  updateVoiceStatus: (serverId: string, channelId: string, status: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
  }) => void;
  onVoiceJoined: (callback: (data: any) => void) => () => void;
  onVoiceMemberJoined: (callback: (user: VoiceUser) => void) => () => void;
  onVoiceMemberLeft: (callback: (user: VoiceUser) => void) => () => void;
}

export const useVoiceChatSFU = (): UseVoiceChatSFUReturn => {
  const {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    currentVoiceChannel: globalCurrentVoiceChannel,
    setVoiceUsers,
    addVoiceUser,
    setVoiceConnected,
    setLocalMuted,
    setCurrentVoiceChannel: setGlobalCurrentVoiceChannel
  } = useAppStore();
  
  // TODO: 실제 사용자 정보를 가져오는 로직 추가 필요
  const user = { id: 'current-user', username: '사용자' };

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
  
  // Speaking Detection
  const localSpeakingDetector = useRef<SpeakingDetector | null>(null);
  const remoteSpeakingDetectors = useRef<{ [trackId: string]: SpeakingDetector }>({});

  /**
   * RTCPeerConnection 생성 (SFU용)
   */
  const createSFUPeerConnection = useCallback(async (userId: string) => {
    try {
      console.log('🔗 SFU RTCPeerConnection 생성 중...');
      
      // TURN 자격증명 가져오기
      const turnCredentials = await cloudflareProxyService.generateTurnCredentials(userId);
      
      console.log('🔧 TURN 자격증명 상세:', {
        provider: turnCredentials.provider,
        iceServersCount: turnCredentials.iceServers?.length || 0,
        iceServersType: typeof turnCredentials.iceServers,
        isArray: Array.isArray(turnCredentials.iceServers),
        sample: turnCredentials.iceServers?.[0]
      });

      // iceServers가 유효한 배열인지 확인
      const iceServers = Array.isArray(turnCredentials.iceServers) 
        ? turnCredentials.iceServers 
        : [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ];
      
      const config: RTCConfiguration = {
        iceServers: iceServers,
        iceCandidatePoolSize: 10,
      };

      console.log('🔧 RTCConfiguration:', config);

      const pc = new RTCPeerConnection(config);
      
      // ICE candidate 수집
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate 수집:', event.candidate.type);
        }
      };

      // 연결 상태 모니터링
      pc.onconnectionstatechange = () => {
        console.log('🔗 SFU 연결 상태:', pc.connectionState);
      };

      // 원격 스트림 수신
      pc.ontrack = (event) => {
        console.log('📡 원격 트랙 수신:', event.track.kind);
        const [remoteStream] = event.streams;
        if (remoteStream) {
          const trackId = event.track.id;
          setRemoteStreams(prev => ({
            ...prev,
            [trackId]: remoteStream
          }));
          
          // 원격 스트림 Speaking Detection 초기화
          if (event.track.kind === 'audio') {
            const detector = new SpeakingDetector();
            detector.initialize(remoteStream, (isSpeaking) => {
              // 원격 사용자 speaking 상태 업데이트
              setRemoteVolumes(prev => ({
                ...prev,
                [trackId]: detector.getCurrentVolume()
              }));
            }).catch(error => {
              console.warn('⚠️ 원격 Speaking Detection 초기화 실패:', error);
            });
            
            remoteSpeakingDetectors.current[trackId] = detector;
            console.log('🎤 원격 Speaking Detection 초기화:', trackId);
          }
        }
      };

      console.log('✅ SFU RTCPeerConnection 생성 완료');
      return pc;

    } catch (error) {
      console.error('❌ SFU RTCPeerConnection 생성 실패:', error);
      throw error;
    }
  }, []);

  /**
   * 로컬 스트림 발행 (SFU에 업로드)
   */
  const publishLocalStream = useCallback(async (stream: MediaStream, sessionId: string): Promise<string> => {
    try {
      if (!peerConnection.current) {
        console.error('❌ PeerConnection이 없습니다');
        throw new Error('PeerConnection not available');
      }

      console.log('📺 로컬 스트림 SFU 발행 시작...');

      // 현재 LocalDescription 사용 (이미 설정됨)
      const currentOffer = peerConnection.current.localDescription;
      if (!currentOffer) {
        console.error('❌ LocalDescription이 설정되지 않았습니다');
        throw new Error('LocalDescription not set');
      }

      console.log('📤 트랙 발행용 Offer 사용:', currentOffer.type);

      // Cloudflare SFU에 트랙 발행 (재시도 로직 포함)
      let track;
      try {
        track = await cloudflareProxyService.publishTrack(sessionId, currentOffer);
      } catch (error: any) {
        // 410 Gone 에러인 경우 세션 재생성 후 재시도
        if (error.message?.includes('410')) {
          console.log('🔄 세션 만료로 인한 재시도 중...');
          
          // 새로운 세션 생성
          const newSession = await cloudflareProxyService.createSession(currentVoiceChannel?.channelId || '', currentOffer);
          setSfuSessionId(newSession.sessionId);
          
          // 새 Answer 설정
          if (newSession.sessionDescription && peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(newSession.sessionDescription));
            console.log('✅ 새 세션 Answer 설정 완료');
          }
          
          // 새 세션으로 트랙 발행 재시도
          track = await cloudflareProxyService.publishTrack(newSession.sessionId, currentOffer);
          console.log('✅ 새 세션으로 트랙 발행 재시도 성공');
        } else {
          throw error;
        }
      }
      
      // 트랙 발행의 Answer는 별도 처리하지 않음 (이미 세션 Answer로 처리됨)
      console.log('📥 트랙 발행 응답:', track.sessionDescription ? '포함' : '없음');

      setPublishedTrackId(track.trackId);
      console.log('✅ 로컬 스트림 SFU 발행 완료:', track.trackId);
      
      return track.trackId;

    } catch (error) {
      console.error('❌ 로컬 스트림 발행 실패:', error);
      throw error;
    }
  }, [currentVoiceChannel]);

  /**
   * 원격 트랙 구독
   */
  const subscribeToRemoteTrack = useCallback(async (trackName: string, sessionId: string) => {
    try {
      if (!peerConnection.current) {
        console.error('❌ PeerConnection이 없습니다');
        return;
      }

      if (subscribedTracks.current.has(trackName)) {
        console.log('⚠️ 이미 구독 중인 트랙:', trackName);
        return;
      }

      console.log('📡 원격 트랙 구독 시작:', trackName);

      // Transceiver 추가 (receive-only)
      peerConnection.current.addTransceiver('audio', { direction: 'recvonly' });

      // Offer 생성
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      // Cloudflare SFU에서 트랙 구독
      const track = await cloudflareProxyService.subscribeToTrack(sessionId, trackName, offer);
      
      // Answer 설정
      if (track.sessionDescription) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(track.sessionDescription)
        );
        console.log('📥 구독 Answer 설정 완료');
      }

      subscribedTracks.current.add(trackName);
      console.log('✅ 원격 트랙 구독 완료:', trackName);

    } catch (error) {
      console.error('❌ 원격 트랙 구독 실패:', error);
    }
  }, []);

  /**
   * WebRTC 연결 완료 대기
   */
  const waitForConnection = useCallback((pc: RTCPeerConnection): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebRTC 연결 타임아웃 (30초)'));
      }, 30000);

      const checkConnection = () => {
        console.log('🔗 현재 연결 상태:', pc.connectionState);
        
        if (pc.connectionState === 'connected' || pc.connectionState === 'completed') {
          clearTimeout(timeout);
          console.log('✅ WebRTC 연결 완료:', pc.connectionState);
          resolve();
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          clearTimeout(timeout);
          reject(new Error(`WebRTC 연결 실패: ${pc.connectionState}`));
        } else {
          // 연결 중인 상태들: 'new', 'connecting', 'checking'
          setTimeout(checkConnection, 500);
        }
      };
      
      checkConnection();
    });
  }, []);

  /**
   * 음성 채널 참가
   */
  const joinVoiceChannel = useCallback(async (serverId: string, channelId: string) => {
    try {
      console.log('');
      console.log('🎬 ========== SFU 음성 채널 참가 시작 ==========');
      console.log('🏠 Server ID:', serverId);
      console.log('📺 Channel ID:', channelId);

      // 즉시 currentVoiceChannel 설정 (UI 표시를 위해)
      setCurrentVoiceChannel({ serverId, channelId });
      console.log('✅ 음성 채널 상태 즉시 설정 완료');

      // 1. 로컬 스트림 획득 (먼저)
      console.log('1️⃣ 로컬 오디오 스트림 획득 중...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
      setLocalStream(stream);
      console.log('✅ 로컬 스트림 획득 완료');

      // Speaking Detection 초기화
      console.log('🎤 Speaking Detection 초기화 중...');
      localSpeakingDetector.current = new SpeakingDetector();
      await localSpeakingDetector.current.initialize(stream, (isSpeaking) => {
        setLocalSpeaking(isSpeaking);
        
        // WebSocket으로 speaking 상태 전송 (Phase 3)
        websocketService.updateSpeakingStatus(serverId, channelId, isSpeaking);
      });
      console.log('✅ Speaking Detection 초기화 완료');

      // 2. RTCPeerConnection 생성
      console.log('2️⃣ SFU PeerConnection 생성 중...');
      const pc = await createSFUPeerConnection(user?.id || 'current-user');
      peerConnection.current = pc;

      // 3. 로컬 스트림 추가
      console.log('3️⃣ 로컬 스트림을 PeerConnection에 추가...');
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log(`➕ 로컬 트랙 추가: ${track.kind}`);
      });

      // 4. Offer 생성 (SDP)
      console.log('4️⃣ WebRTC Offer 생성 중...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);
      console.log('✅ Offer 생성 및 LocalDescription 설정 완료');

      // 5. SFU 세션 생성 (실제 SDP 포함)
      console.log('5️⃣ SFU 세션 생성 중...');
      const session = await cloudflareProxyService.createSession(channelId, offer);
      setSfuSessionId(session.sessionId);
      console.log('✅ SFU 세션 생성 완료:', session.sessionId);

      // 6. Answer 설정 (중요!)
      if (session.sessionDescription) {
        console.log('6️⃣ SFU Answer 설정 중...');
        await pc.setRemoteDescription(new RTCSessionDescription(session.sessionDescription));
        console.log('✅ SFU Answer 설정 완료');
      } else {
        throw new Error('세션에서 Answer를 받지 못했습니다');
      }

      // 7. 상태 즉시 설정 (UI 응답성 향상)
      console.log('7️⃣ 음성 채널 상태 즉시 설정...');
      setCurrentVoiceChannel({ serverId, channelId });
      setVoiceConnected(true);

      // 8. 로컬 스트림 발행 (연결 대기 없이 진행)
      console.log('8️⃣ 로컬 스트림 SFU 발행 중...');
      const trackId = await publishLocalStream(stream, session.sessionId);
      console.log('✅ 트랙 ID 획득:', trackId);

      // 9. 현재 사용자를 즉시 voiceUsers에 추가
      const currentUser: VoiceUser = {
        id: user?.id || 'current-user',
        userId: user?.id || 'current-user',
        username: user?.username || '사용자',
        serverId: serverId,
        channelId: channelId,
        volume: 50,
        isMuted: false,
        isConnected: true,
        trackId: trackId,
        isSpeaking: false,
      };
      
      console.log('👤 현재 사용자를 voiceUsers에 즉시 추가:', currentUser);
      addVoiceUser(currentUser);
      
      // 10. Signal Server 음성 참가 알림
      console.log('🔟 Signal Server 음성 참가 알림...');
      websocketService.joinVoiceChannel(serverId, channelId, trackId);

      // WebRTC 연결 완료를 백그라운드에서 대기 (블로킹 없음)
      waitForConnection(pc).then(() => {
        console.log('✅ WebRTC 연결 완료 (백그라운드)');
        
        // 연결 완료 후 기존 사용자 트랙 강제 구독 시도
        setTimeout(() => {
          console.log('🔄 기존 사용자 트랙 강제 구독 시도...');
          const currentUsers = voiceUsers.filter(u => 
            u.trackId && 
            u.trackId !== publishedTrackId && 
            u.serverId === serverId && 
            u.channelId === channelId
          );
          
          currentUsers.forEach(user => {
            console.log(`🎧 강제 구독 시도: ${user.username} (${user.trackId})`);
            subscribeToRemoteTrack(user.trackId!, session.sessionId)
              .catch(error => console.warn('⚠️ 강제 구독 실패:', error));
          });
        }, 2000);
      }).catch((error) => {
        console.warn('⚠️ WebRTC 연결 완료 대기 실패 (무시됨):', error);
      });

      console.log('✅ ========== SFU 음성 채널 참가 완료 ==========');
      console.log('');

    } catch (error) {
      console.error('❌ SFU 음성 채널 참가 실패:', error);
      
      // 상태 롤백 (에러 발생 시 UI 상태 복원)
      setVoiceConnected(false);
      setCurrentVoiceChannel(undefined);
      
      // 정리 작업
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setSfuSessionId(null);
      setPublishedTrackId(null);
      
      console.log('🔄 음성 채널 상태 롤백 완료');
      throw error;
    }
  }, [createSFUPeerConnection, publishLocalStream, waitForConnection, localStream, setVoiceConnected, user, addVoiceUser]);

  /**
   * 음성 채널 퇴장
   */
  const leaveVoiceChannel = useCallback(() => {
    try {
      console.log('🚪 SFU 음성 채널 퇴장 시작...');

      // 1. 로컬 스트림 정리
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`🛑 로컬 트랙 정지: ${track.kind}`);
        });
        setLocalStream(null);
      }

      // 2. 발행된 트랙 종료
      if (publishedTrackId && sfuSessionId) {
        cloudflareProxyService.closeTrack(sfuSessionId, publishedTrackId)
          .catch(error => console.warn('⚠️ 트랙 종료 실패:', error));
        setPublishedTrackId(null);
      }

      // 3. PeerConnection 정리
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
        console.log('🔌 PeerConnection 종료');
      }

      // 4. Speaking Detection 정리
      if (localSpeakingDetector.current) {
        localSpeakingDetector.current.destroy();
        localSpeakingDetector.current = null;
        console.log('🎤 로컬 Speaking Detection 정리 완료');
      }
      
      // 원격 Speaking Detection 정리
      Object.values(remoteSpeakingDetectors.current).forEach(detector => {
        detector.destroy();
      });
      remoteSpeakingDetectors.current = {};
      console.log('🎤 원격 Speaking Detection 정리 완료');
      
      // 상태 초기화
      setLocalSpeaking(false);
      setRemoteVolumes({});

      // 5. 원격 스트림 정리
      setRemoteStreams({});
      subscribedTracks.current.clear();

      // 5. Signal Server에 퇴장 알림
      if (currentVoiceChannel) {
        websocketService.leaveVoiceChannel(currentVoiceChannel.serverId, currentVoiceChannel.channelId);
      }

      // 6. 세션 정리
      if (currentVoiceChannel && sfuSessionId) {
        cloudflareProxyService.cleanupSession(currentVoiceChannel.channelId)
          .catch(error => console.warn('⚠️ 세션 정리 실패:', error));
      }

      // 7. 상태 초기화
      setCurrentVoiceChannel(undefined);
      setSfuSessionId(null);
      setVoiceConnected(false);
      setVoiceUsers([]); // 음성 사용자 목록 초기화

      console.log('✅ SFU 음성 채널 퇴장 완료');

    } catch (error) {
      console.error('❌ 음성 채널 퇴장 중 오류:', error);
    }
  }, [localStream, publishedTrackId, sfuSessionId, currentVoiceChannel, setVoiceConnected]);

  /**
   * 음소거 토글
   */
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setLocalMuted(!audioTrack.enabled);
        
        console.log(`🎤 음소거 ${audioTrack.enabled ? '해제' : '설정'}`);
        
        // Signal Server에 상태 업데이트 알림
        if (currentVoiceChannel) {
          updateVoiceStatus(currentVoiceChannel.serverId, currentVoiceChannel.channelId, {
            isMuted: !audioTrack.enabled
          });
        }
      }
    }
  }, [localStream, currentVoiceChannel, setLocalMuted]);

  /**
   * 음성 상태 업데이트
   */
  const updateVoiceStatus = useCallback((serverId: string, channelId: string, status: {
    isMuted?: boolean;
    isDeafened?: boolean;
    isScreenSharing?: boolean;
  }) => {
    websocketService.updateVoiceStatus(serverId, channelId, status);
  }, []);

  /**
   * 음성 이벤트 리스너들
   */
  const onVoiceJoined = useCallback((callback: (data: any) => void) => {
    const handler = (data: any) => {
      console.log('🔔 음성 참가 성공:', data);
      
      // 기존 사용자 목록 처리 (현재 사용자는 이미 추가됨)
      if (data.currentUsers && Array.isArray(data.currentUsers)) {
        console.log('👥 기존 음성 사용자 목록:', data.currentUsers);
        
        // 기존 사용자들을 voiceUsers에 추가 (채널 정보 정규화)
        data.currentUsers.forEach((voiceUser: VoiceUser) => {
          // 현재 사용자가 아닌 경우만 추가
          const currentUserId = user?.id || 'current-user';
          if (voiceUser.id !== currentUserId && 
              voiceUser.userId !== currentUserId) {
            
            // 채널 정보가 누락된 경우 현재 채널 정보로 설정
            const normalizedUser: VoiceUser = {
              ...voiceUser,
              serverId: voiceUser.serverId || data.serverId,
              channelId: voiceUser.channelId || data.channelId
            };
            
            console.log('👤 기존 사용자 정규화:', {
              original: voiceUser,
              normalized: normalizedUser
            });
            
            addVoiceUser(normalizedUser);
          }
        });
        
        // 기존 사용자들의 트랙 구독
        if (sfuSessionId) {
          data.currentUsers.forEach((user: any) => {
            const trackId = user.trackId || `audio_${user.id || user.userId}`;
            if (trackId && trackId !== publishedTrackId) {
              console.log(`🎧 기존 사용자 트랙 구독: ${user.username} (${trackId})`);
              subscribeToRemoteTrack(trackId, sfuSessionId)
                .catch(error => console.warn('⚠️ 자동 트랙 구독 실패:', error));
            }
          });
        }
      }
      
      callback(data);
    };
    
    websocketService.on('voice:join:success', handler);
    return () => websocketService.off('voice:join:success', handler);
  }, [sfuSessionId, publishedTrackId, subscribeToRemoteTrack, addVoiceUser, user]);

  const onVoiceMemberJoined = useCallback((callback: (user: VoiceUser) => void) => {
    const handler = (user: VoiceUser) => {
      console.log('🔔 음성 사용자 참가:', user.username, 'TrackID:', user.trackId);
      
      // 채널 정보가 누락된 경우 현재 채널 정보로 설정
      const normalizedUser: VoiceUser = {
        ...user,
        serverId: user.serverId || currentVoiceChannel?.serverId || '',
        channelId: user.channelId || currentVoiceChannel?.channelId || ''
      };
      
      console.log('👤 신규 사용자 정규화:', {
        original: user,
        normalized: normalizedUser
      });
      
      // 음성 사용자 목록에 새 사용자 추가
      setVoiceUsers(prevUsers => {
        const existingUser = prevUsers.find(u => u.userId === normalizedUser.userId);
        if (!existingUser) {
          console.log('👥 새 사용자를 음성 목록에 추가:', normalizedUser.username);
          return [...prevUsers, normalizedUser];
        }
        return prevUsers;
      });
      
      // 새 사용자의 트랙 자동 구독 (강화된 로직)
      if (normalizedUser.trackId && sfuSessionId && normalizedUser.trackId !== publishedTrackId) {
        console.log(`🎧 신규 사용자 트랙 구독: ${normalizedUser.username} (${normalizedUser.trackId})`);
        console.log(`🔍 구독 조건 확인: trackId=${normalizedUser.trackId}, sessionId=${sfuSessionId}, publishedTrackId=${publishedTrackId}`);
        
        subscribeToRemoteTrack(normalizedUser.trackId, sfuSessionId)
          .then(() => {
            console.log(`✅ 신규 사용자 트랙 구독 성공: ${normalizedUser.username}`);
          })
          .catch(error => {
            console.error(`❌ 신규 사용자 트랙 구독 실패: ${normalizedUser.username}`, error);
            
            // 재시도 로직
            setTimeout(() => {
              console.log(`🔄 트랙 구독 재시도: ${normalizedUser.username} (${normalizedUser.trackId})`);
              subscribeToRemoteTrack(normalizedUser.trackId!, sfuSessionId)
                .catch(retryError => console.error('❌ 트랙 구독 재시도 실패:', retryError));
            }, 3000);
          });
      } else {
        console.warn('⚠️ 트랙 구독 조건 불충족:', {
          hasTrackId: !!normalizedUser.trackId,
          hasSessionId: !!sfuSessionId,
          isDifferentTrack: normalizedUser.trackId !== publishedTrackId,
          userTrackId: normalizedUser.trackId,
          publishedTrackId: publishedTrackId
        });
      }
      
      callback(normalizedUser);
    };
    
    websocketService.on('voice:user-joined', handler);
    return () => websocketService.off('voice:user-joined', handler);
  }, [sfuSessionId, publishedTrackId, subscribeToRemoteTrack, setVoiceUsers, currentVoiceChannel]);

  const onVoiceMemberLeft = useCallback((callback: (user: VoiceUser) => void) => {
    const handler = (user: VoiceUser) => {
      console.log('🔔 음성 사용자 퇴장:', user.username);
      
      // 사용자의 트랙 정리
      const trackId = user.trackId || `audio_${user.id || user.userId}`;
      if (trackId) {
        console.log(`🧹 사용자 트랙 정리: ${user.username} (${trackId})`);
        setRemoteStreams(prev => {
          const updated = { ...prev };
          delete updated[trackId];
          return updated;
        });
        subscribedTracks.current.delete(trackId);
      }
      
      callback(user);
    };
    
    websocketService.on('voice:user-left', handler);
    return () => websocketService.off('voice:user-left', handler);
  }, []);

  // Phase 3: 새로운 Discord 스타일 이벤트 리스너들
  
  // Speaking 상태 업데이트 리스너
  useEffect(() => {
    const handler = (data: { userId: string; isSpeaking: boolean }) => {
      setVoiceUsers(prevUsers => 
        prevUsers.map(user => 
          user.userId === data.userId || user.id === data.userId
            ? { ...user, isSpeaking: data.isSpeaking }
            : user
        )
      );
    };
    
    websocketService.on('voice:speaking:updated', handler);
    return () => websocketService.off('voice:speaking:updated', handler);
  }, [setVoiceUsers]);

  // 음성 채널 상태 전체 업데이트 리스너
  useEffect(() => {
    const handler = (data: { serverId: string; channelId: string; users: VoiceUser[] }) => {
      if (currentVoiceChannel?.serverId === data.serverId && 
          currentVoiceChannel?.channelId === data.channelId) {
        console.log('🔄 Voice state updated:', data.users);
        setVoiceUsers(data.users);
      }
    };
    
    websocketService.on('voice:state:updated', handler);
    return () => websocketService.off('voice:state:updated', handler);
  }, [currentVoiceChannel, setVoiceUsers]);

  // 음성 사용자 목록 수신 리스너
  useEffect(() => {
    const handler = (data: { serverId: string; channelId: string; users: VoiceUser[] }) => {
      if (currentVoiceChannel?.serverId === data.serverId && 
          currentVoiceChannel?.channelId === data.channelId) {
        console.log('📋 Voice users received:', data.users);
        setVoiceUsers(data.users);
      }
    };
    
    websocketService.on('voice:users:received', handler);
    return () => websocketService.off('voice:users:received', handler);
  }, [currentVoiceChannel, setVoiceUsers]);

  // voice:join:success 이벤트 리스너 등록
  useEffect(() => {
    const cleanup = onVoiceJoined((data: any) => {
      console.log('🎯 Voice join success 처리 완료');
    });
    return cleanup;
  }, [onVoiceJoined]);

  // voice:user-joined 이벤트 리스너 등록  
  useEffect(() => {
    const cleanup = onVoiceMemberJoined((user: VoiceUser) => {
      console.log('🎯 Voice member joined 처리 완료:', user.username);
    });
    return cleanup;
  }, [onVoiceMemberJoined]);

  // 컴포넌트 언마운트 시에만 정리 (cleanup을 직접 구현)
  useEffect(() => {
    return () => {
      console.log('🧹 컴포넌트 언마운트 감지 - 음성 연결 정리 시작...');
      
      // 직접 정리 수행 (leaveVoiceChannel 함수 호출 대신)
      try {
        // 1. 로컬 스트림 정리
        if (localStream) {
          localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`🛑 언마운트 시 로컬 트랙 정지: ${track.kind}`);
          });
          setLocalStream(null);
        }

        // 2. PeerConnection 정리
        if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
          console.log('🔌 언마운트 시 PeerConnection 종료');
        }

        // 3. Speaking Detection 정리
        if (localSpeakingDetector.current) {
          localSpeakingDetector.current.destroy();
          localSpeakingDetector.current = null;
        }
        
        // 원격 Speaking Detection 정리
        Object.values(remoteSpeakingDetectors.current).forEach(detector => {
          detector.destroy();
        });
        remoteSpeakingDetectors.current = {};
        
        // 4. 상태 초기화
        setCurrentVoiceChannel(undefined);
        setSfuSessionId(null);
        setVoiceConnected(false);
        setLocalSpeaking(false);
        setRemoteStreams({});
        setRemoteVolumes({});
        subscribedTracks.current.clear();

        console.log('✅ 언마운트 시 음성 연결 정리 완료');

      } catch (error) {
        console.error('❌ 언마운트 시 정리 중 오류:', error);
      }
    };
  }, []); // 빈 dependency 배열

  return {
    voiceUsers,
    isVoiceConnected,
    localMuted,
    localSpeaking,
    currentVoiceChannel,
    localStream,
    remoteStreams,
    remoteVolumes,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    updateVoiceStatus,
    onVoiceJoined,
    onVoiceMemberJoined,
    onVoiceMemberLeft,
  };
};

/**
 * 브라우저 종료/페이지 이탈 감지 및 세션 정리
 */
export const useVoiceSessionCleanup = () => {
  const { leaveVoiceChannel, isVoiceConnected, currentVoiceChannel } = useVoiceChatSFU();

  useEffect(() => {
    // 즉시 실행 함수로 정리 로직 생성
    const cleanupVoiceSession = () => {
      console.log('🚨 브라우저 종료 감지 - 전체 세션 긴급 정리 시작');
      
      // 1. 음성 채널에서 나가기 (우선 순위 최고)
      if (isVoiceConnected && currentVoiceChannel) {
        console.log('🎤 음성 세션 정리 중...');
        
        // 동기적으로 WebSocket에 나가기 알림 전송
        if (websocketService.isConnected()) {
          websocketService.leaveVoiceChannel(
            currentVoiceChannel.serverId, 
            currentVoiceChannel.channelId
          );
        }
        
        // SFU 세션 정리 (비동기지만 최대한 시도)
        try {
          leaveVoiceChannel();
        } catch (error) {
          console.warn('⚠️ 종료 시 음성 세션 정리 중 오류:', error);
        }
      }
      
      // 2. WebSocket 연결 정리
      if (websocketService.isConnected()) {
        console.log('🔌 WebSocket 연결 정리 중...');
        try {
          // 서버에 연결 해제 알림 전송 후 연결 종료
          websocketService.disconnect();
          console.log('✅ WebSocket 연결 정리 완료');
        } catch (error) {
          console.warn('⚠️ WebSocket 연결 정리 중 오류:', error);
        }
      }
      
      console.log('✅ 전체 세션 긴급 정리 완료');
    };

    // 1. 브라우저 창 닫기 / 탭 닫기 감지
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isVoiceConnected) {
        console.log('🚨 beforeunload 이벤트 감지');
        cleanupVoiceSession();
        
        // 사용자에게 경고 메시지 표시 (선택사항)
        event.preventDefault();
        event.returnValue = '음성 채팅을 종료하시겠습니까?';
        return event.returnValue;
      }
    };

    // 2. 페이지 숨김/나가기 감지 (모바일 포함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isVoiceConnected) {
        console.log('🚨 페이지 숨김 감지 - 음성 세션 정리');
        cleanupVoiceSession();
      }
    };

    // 3. 페이지 언로드 감지 (최후의 수단)
    const handleUnload = () => {
      if (isVoiceConnected) {
        console.log('🚨 unload 이벤트 감지');
        cleanupVoiceSession();
      }
    };

    // 4. popstate 이벤트 감지 (뒤로가기/앞으로가기)
    const handlePopState = () => {
      if (isVoiceConnected) {
        console.log('🚨 브라우저 네비게이션 감지');
        cleanupVoiceSession();
      }
    };

    // 5. 온라인/오프라인 상태 변화 감지
    const handleOffline = () => {
      if (isVoiceConnected) {
        console.log('🚨 오프라인 상태 감지');
        cleanupVoiceSession();
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('offline', handleOffline);

    // 정리 함수
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isVoiceConnected, currentVoiceChannel, leaveVoiceChannel]);
};