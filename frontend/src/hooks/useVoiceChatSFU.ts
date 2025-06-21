import { useEffect, useCallback, useState, useRef } from 'react';
import websocketService, { VoiceUser } from '../services/websocketService';
import { useAppStore } from '../store/useAppStore';
import cloudflareSFUService from '../services/cloudflareService';

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
    setVoiceUsers,
    setVoiceConnected,
    setLocalMuted,
    user
  } = useAppStore();

  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<{ serverId: string; channelId: string } | undefined>();
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
      const turnCredentials = await cloudflareSFUService.generateTurnCredentials(userId);
      
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
  const publishLocalStream = useCallback(async (stream: MediaStream, sessionId: string) => {
    try {
      if (!peerConnection.current) {
        console.error('❌ PeerConnection이 없습니다');
        return;
      }

      console.log('📺 로컬 스트림 SFU 발행 시작...');

      // 현재 LocalDescription 사용 (이미 설정됨)
      const currentOffer = peerConnection.current.localDescription;
      if (!currentOffer) {
        console.error('❌ LocalDescription이 설정되지 않았습니다');
        return;
      }

      console.log('📤 트랙 발행용 Offer 사용:', currentOffer.type);

      // Cloudflare SFU에 트랙 발행
      const track = await cloudflareSFUService.publishTrack(sessionId, currentOffer);
      
      // 트랙 발행의 Answer는 별도 처리하지 않음 (이미 세션 Answer로 처리됨)
      console.log('📥 트랙 발행 응답:', track.sessionDescription ? '포함' : '없음');

      setPublishedTrackId(track.trackId);
      console.log('✅ 로컬 스트림 SFU 발행 완료:', track.trackId);

    } catch (error) {
      console.error('❌ 로컬 스트림 발행 실패:', error);
      throw error;
    }
  }, []);

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
      const track = await cloudflareSFUService.subscribeToTrack(sessionId, trackName, offer);
      
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
      const session = await cloudflareSFUService.createSession(channelId, offer);
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

      // 7. WebRTC 연결 완료 대기 (중요!)
      console.log('7️⃣ WebRTC 연결 완료 대기 중...');
      await waitForConnection(pc);

      // 8. 로컬 스트림 발행 (연결 완료 후)
      console.log('8️⃣ 로컬 스트림 SFU 발행 중...');
      await publishLocalStream(stream, session.sessionId);

      // 9. Signal Server에 음성 참가 알림 (trackId 포함)
      console.log('9️⃣ Signal Server 음성 참가 알림...');
      websocketService.joinVoiceChannel(serverId, channelId, publishedTrackId);
      
      // 로컬 사용자 trackId 설정 (WebSocket 메시지에 포함될 수 있도록)
      if (publishedTrackId && user) {
        console.log(`✅ 로컬 사용자 트랙 ID 설정: ${user.username} (${publishedTrackId})`);
      }

      setCurrentVoiceChannel({ serverId, channelId });
      setVoiceConnected(true);

      console.log('✅ ========== SFU 음성 채널 참가 완료 ==========');
      console.log('');

    } catch (error) {
      console.error('❌ SFU 음성 채널 참가 실패:', error);
      
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
      
      throw error;
    }
  }, [createSFUPeerConnection, publishLocalStream, waitForConnection, localStream, setVoiceConnected, user]);

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
        cloudflareSFUService.closeTrack(sfuSessionId, publishedTrackId)
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
        cloudflareSFUService.cleanupSession(currentVoiceChannel.channelId)
          .catch(error => console.warn('⚠️ 세션 정리 실패:', error));
      }

      // 7. 상태 초기화
      setCurrentVoiceChannel(undefined);
      setSfuSessionId(null);
      setVoiceConnected(false);

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
      
      // 음성 사용자 목록을 앱 스토어에 업데이트
      if (data.currentUsers && Array.isArray(data.currentUsers)) {
        console.log('👥 음성 사용자 목록 업데이트:', data.currentUsers);
        setVoiceUsers(data.currentUsers);
      }
      
      // 기존 사용자들의 트랙 구독
      if (data.currentUsers && sfuSessionId) {
        data.currentUsers.forEach((user: any) => {
          const trackId = user.trackId || `audio_${user.id || user.userId}`;
          if (trackId && trackId !== publishedTrackId) {
            console.log(`🎧 기존 사용자 트랙 구독: ${user.username} (${trackId})`);
            subscribeToRemoteTrack(trackId, sfuSessionId)
              .catch(error => console.warn('⚠️ 자동 트랙 구독 실패:', error));
          }
        });
      }
      
      callback(data);
    };
    
    websocketService.on('voice:join:success', handler);
    return () => websocketService.off('voice:join:success', handler);
  }, [sfuSessionId, publishedTrackId, subscribeToRemoteTrack, setVoiceUsers]);

  const onVoiceMemberJoined = useCallback((callback: (user: VoiceUser) => void) => {
    const handler = (user: VoiceUser) => {
      console.log('🔔 음성 사용자 참가:', user.username, 'TrackID:', user.trackId);
      
      // 음성 사용자 목록에 새 사용자 추가
      setVoiceUsers(prevUsers => {
        const existingUser = prevUsers.find(u => u.userId === user.userId);
        if (!existingUser) {
          console.log('👥 새 사용자를 음성 목록에 추가:', user.username);
          return [...prevUsers, user];
        }
        return prevUsers;
      });
      
      // 새 사용자의 트랙 자동 구독
      if (user.trackId && sfuSessionId && user.trackId !== publishedTrackId) {
        console.log(`🎧 신규 사용자 트랙 구독: ${user.username} (${user.trackId})`);
        subscribeToRemoteTrack(user.trackId, sfuSessionId)
          .catch(error => console.warn('⚠️ 신규 사용자 트랙 구독 실패:', error));
      }
      
      callback(user);
    };
    
    websocketService.on('voice:user-joined', handler);
    return () => websocketService.off('voice:user-joined', handler);
  }, [sfuSessionId, publishedTrackId, subscribeToRemoteTrack, setVoiceUsers]);

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