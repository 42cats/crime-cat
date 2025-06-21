/**
 * Cloudflare Realtime SFU 서비스
 * P2P 대신 SFU를 통한 중앙 집중식 미디어 라우팅
 */

const SIGNAL_SERVER_URL = import.meta.env.VITE_SIGNAL_SERVER_URL || 'http://localhost:4000';

export interface SFUSession {
  sessionId: string;
  channelId: string;
  tracks: SFUTrack[];
  participants: string[];
}

export interface SFUTrack {
  trackId: string;
  userId: string;
  username: string;
  mediaType: 'audio' | 'video';
  active: boolean;
}

export class SFUService {
  private sessions: Map<string, SFUSession> = new Map();
  private publishConnection: RTCPeerConnection | null = null;
  private subscribeConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private localTrackId: string | null = null;

  constructor() {
    console.log('🎬 SFUService 초기화');
  }

  /**
   * SFU 세션 생성
   */
  async createSession(channelId: string): Promise<SFUSession | null> {
    try {
      console.log(`🎬 SFU 세션 생성 요청: ${channelId}`);
      
      const response = await fetch(`${SIGNAL_SERVER_URL}/api/webrtc/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channelId,
          options: {
            // SFU 관련 옵션
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data.success) {
        throw new Error(result.data?.error || 'SFU 세션 생성 실패');
      }

      const session: SFUSession = {
        sessionId: result.data.session.sessionId || channelId,
        channelId: channelId,
        tracks: [],
        participants: []
      };

      this.sessions.set(channelId, session);
      
      console.log('✅ SFU 세션 생성 성공:', session.sessionId);
      return session;
      
    } catch (error) {
      console.error('❌ SFU 세션 생성 실패:', error.message);
      return null;
    }
  }

  /**
   * 로컬 스트림을 SFU에 발행 (업로드) - WebSocket 사용
   */
  async publishStream(sessionId: string, localStream: MediaStream, turnCredentials: any, serverId: string, channelId: string): Promise<boolean> {
    try {
      console.log(`📺 SFU에 스트림 발행 시작: ${sessionId}`);
      
      // TURN 자격증명을 사용한 RTCPeerConnection 생성
      this.publishConnection = new RTCPeerConnection({
        iceServers: turnCredentials.iceServers
      });

      // 로컬 스트림 추가
      localStream.getTracks().forEach(track => {
        console.log(`🎵 트랙 추가: ${track.kind} - ${track.label}`);
        this.publishConnection!.addTrack(track, localStream);
      });

      this.localStream = localStream;

      // ICE candidate 처리
      this.publishConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Publish ICE Candidate:', event.candidate.type);
        }
      };

      // 연결 상태 모니터링
      this.publishConnection.onconnectionstatechange = () => {
        console.log('🔗 Publish Connection State:', this.publishConnection?.connectionState);
      };

      // Offer 생성
      const offer = await this.publishConnection.createOffer();
      await this.publishConnection.setLocalDescription(offer);

      // WebSocket을 통해 SFU에 트랙 발행 요청
      return new Promise((resolve, reject) => {
        const { default: websocketService } = require('./websocketService');
        
        // 성공 이벤트 리스너
        const onSuccess = (data: any) => {
          websocketService.off('sfu:track:publish:success', onSuccess);
          websocketService.off('sfu:track:publish:error', onError);
          
          // SFU에서 받은 Answer 설정
          this.publishConnection!.setRemoteDescription(data.answer)
            .then(() => {
              this.localTrackId = data.trackId;
              console.log('✅ SFU 스트림 발행 성공, Track ID:', this.localTrackId);
              resolve(true);
            })
            .catch(reject);
        };
        
        // 실패 이벤트 리스너
        const onError = (data: any) => {
          websocketService.off('sfu:track:publish:success', onSuccess);
          websocketService.off('sfu:track:publish:error', onError);
          
          if (this.publishConnection) {
            this.publishConnection.close();
            this.publishConnection = null;
          }
          
          console.error('❌ SFU 스트림 발행 실패:', data.error);
          resolve(false);
        };
        
        websocketService.on('sfu:track:publish:success', onSuccess);
        websocketService.on('sfu:track:publish:error', onError);
        
        // WebSocket으로 트랙 발행 요청 전송
        websocketService.publishTrack(offer, serverId, channelId);
        
        // 타임아웃 설정 (10초)
        setTimeout(() => {
          websocketService.off('sfu:track:publish:success', onSuccess);
          websocketService.off('sfu:track:publish:error', onError);
          
          if (this.publishConnection) {
            this.publishConnection.close();
            this.publishConnection = null;
          }
          
          console.error('❌ SFU 스트림 발행 타임아웃');
          resolve(false);
        }, 10000);
      });
      
    } catch (error) {
      console.error('❌ SFU 스트림 발행 실패:', error.message);
      
      if (this.publishConnection) {
        this.publishConnection.close();
        this.publishConnection = null;
      }
      
      return false;
    }
  }

  /**
   * 다른 사용자의 스트림 구독 (다운로드) - WebSocket 사용
   */
  async subscribeToTrack(sessionId: string, trackId: string, userId: string, turnCredentials: any, serverId: string, channelId: string): Promise<MediaStream | null> {
    try {
      console.log(`📡 SFU 트랙 구독 시작: ${trackId} (User: ${userId})`);
      
      // TURN 자격증명을 사용한 RTCPeerConnection 생성
      const subscribeConnection = new RTCPeerConnection({
        iceServers: turnCredentials.iceServers
      });

      // 수신 전용 트랜시버 추가
      subscribeConnection.addTransceiver('audio', { direction: 'recvonly' });

      let remoteStream: MediaStream | null = null;

      // 원격 스트림 수신
      subscribeConnection.ontrack = (event) => {
        console.log('📨 SFU에서 트랙 수신:', event.track.kind);
        remoteStream = event.streams[0];
      };

      // ICE candidate 처리
      subscribeConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Subscribe ICE Candidate:', event.candidate.type);
        }
      };

      // 연결 상태 모니터링
      subscribeConnection.onconnectionstatechange = () => {
        console.log('🔗 Subscribe Connection State:', subscribeConnection.connectionState);
      };

      // Offer 생성
      const offer = await subscribeConnection.createOffer();
      await subscribeConnection.setLocalDescription(offer);

      // WebSocket을 통해 SFU에 트랙 구독 요청
      return new Promise((resolve, reject) => {
        const { default: websocketService } = require('./websocketService');
        
        // 성공 이벤트 리스너
        const onSuccess = (data: any) => {
          if (data.trackId === trackId) {
            websocketService.off('sfu:track:subscribe:success', onSuccess);
            websocketService.off('sfu:track:subscribe:error', onError);
            
            // SFU에서 받은 Answer 설정
            subscribeConnection.setRemoteDescription(data.answer)
              .then(() => {
                // 연결 저장
                this.subscribeConnections.set(userId, subscribeConnection);
                console.log('✅ SFU 트랙 구독 성공:', trackId);
                
                // 스트림이 수신될 때까지 대기
                let attempts = 0;
                const maxAttempts = 50; // 5초 대기
                
                const checkStream = () => {
                  attempts++;
                  if (remoteStream) {
                    resolve(remoteStream);
                  } else if (attempts < maxAttempts) {
                    setTimeout(checkStream, 100);
                  } else {
                    console.warn('⚠️ SFU 스트림 수신 시간 초과');
                    resolve(null);
                  }
                };
                
                checkStream();
              })
              .catch(reject);
          }
        };
        
        // 실패 이벤트 리스너
        const onError = (data: any) => {
          if (data.trackId === trackId) {
            websocketService.off('sfu:track:subscribe:success', onSuccess);
            websocketService.off('sfu:track:subscribe:error', onError);
            
            subscribeConnection.close();
            console.error('❌ SFU 트랙 구독 실패:', data.error);
            resolve(null);
          }
        };
        
        websocketService.on('sfu:track:subscribe:success', onSuccess);
        websocketService.on('sfu:track:subscribe:error', onError);
        
        // WebSocket으로 트랙 구독 요청 전송
        websocketService.subscribeToTrack(trackId, offer, serverId, channelId);
        
        // 타임아웃 설정 (10초)
        setTimeout(() => {
          websocketService.off('sfu:track:subscribe:success', onSuccess);
          websocketService.off('sfu:track:subscribe:error', onError);
          
          subscribeConnection.close();
          console.error('❌ SFU 트랙 구독 타임아웃');
          resolve(null);
        }, 10000);
      });
      
    } catch (error) {
      console.error('❌ SFU 트랙 구독 실패:', error.message);
      return null;
    }
  }

  /**
   * 로컬 트랙 발행 중단 - WebSocket 사용
   */
  async unpublishTrack(sessionId: string, serverId?: string, channelId?: string): Promise<void> {
    if (!this.localTrackId) {
      return;
    }

    try {
      console.log(`🔚 SFU 트랙 발행 중단: ${this.localTrackId}`);
      
      // WebSocket을 통한 트랙 발행 중단이 외부에서 이미 호출되었으므로
      // 여기서는 로컬 연결만 정리
      console.log('✅ SFU 트랙 발행 중단 완료 (WebSocket을 통해 처리됨)');
      
    } catch (error) {
      console.error('❌ SFU 트랙 발행 중단 오류:', error.message);
    } finally {
      if (this.publishConnection) {
        this.publishConnection.close();
        this.publishConnection = null;
      }
      this.localTrackId = null;
    }
  }

  /**
   * 구독 중단
   */
  unsubscribeFromTrack(userId: string): void {
    const connection = this.subscribeConnections.get(userId);
    if (connection) {
      console.log(`🔚 SFU 트랙 구독 중단: ${userId}`);
      connection.close();
      this.subscribeConnections.delete(userId);
    }
  }

  /**
   * 세션 정리
   */
  async leaveSession(sessionId: string): Promise<void> {
    console.log(`👋 SFU 세션 종료: ${sessionId}`);
    
    // 발행 중단
    await this.unpublishTrack(sessionId);
    
    // 모든 구독 중단
    for (const [userId, connection] of this.subscribeConnections) {
      connection.close();
    }
    this.subscribeConnections.clear();
    
    // 세션 제거
    this.sessions.delete(sessionId);
    
    console.log('✅ SFU 세션 정리 완료');
  }

  /**
   * 현재 세션 정보 조회
   */
  getSession(channelId: string): SFUSession | null {
    return this.sessions.get(channelId) || null;
  }

  /**
   * 연결 상태 확인
   */
  getConnectionStates(): { publish: string; subscribes: { [userId: string]: string } } {
    const subscribes: { [userId: string]: string } = {};
    
    for (const [userId, connection] of this.subscribeConnections) {
      subscribes[userId] = connection.connectionState;
    }
    
    return {
      publish: this.publishConnection?.connectionState || 'closed',
      subscribes: subscribes
    };
  }
}

// 싱글톤 인스턴스
export const sfuService = new SFUService();

// 개발 모드에서 전역으로 노출 (디버깅용)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).sfuService = sfuService;
  console.log('🌐 SFUService는 window.sfuService로 사용 가능합니다');
}

export default sfuService;