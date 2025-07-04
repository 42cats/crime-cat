/**
 * Cloudflare API 프록시 서비스 (Backend 경유)
 * - 보안 강화: API 키를 Backend에서 관리
 * - CORS 해결: Backend가 Cloudflare API 프록시 역할
 * - 에러 처리 개선: 통일된 에러 응답
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export interface CloudflareSession {
  sessionId: string;
  sessionDescription?: any;
}

export interface CloudflareTrack {
  trackName: string;
  trackId: string;
  mid: string;
  sessionDescription: any;
}

export interface TurnCredentials {
  iceServers: RTCIceServer[];
  expiresAt: string;
  provider: string;
}

class CloudflareProxyService {
  private sessions = new Map<string, CloudflareSession>();
  private publishedTracks = new Map<string, { trackName: string; mid: string }>();

  /**
   * TURN 자격증명 생성 (Backend 프록시 경유)
   */
  async generateTurnCredentials(userId: string): Promise<TurnCredentials> {
    try {
      console.log(`🔑 TURN 자격증명 요청 (Backend 프록시) - User: ${userId}`);

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/turn/credentials?userId=${encodeURIComponent(userId)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TURN API Proxy Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ TURN 자격증명 획득 성공 (Backend 프록시)');

      // Backend 응답 처리
      let iceServers = [];
      
      if (result.iceServers && Array.isArray(result.iceServers)) {
        iceServers = result.iceServers;
      } else if (result.iceServers && typeof result.iceServers === 'object') {
        if (result.iceServers.urls) {
          iceServers = [result.iceServers];
        }
      }

      // 폴백 STUN 서버 추가
      const fallbackStunServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ];

      const combinedServers = [...iceServers, ...fallbackStunServers];

      return {
        iceServers: combinedServers,
        expiresAt: result.expiresAt || new Date(Date.now() + 86400 * 1000).toISOString(),
        provider: `cloudflare-proxy+fallback (${iceServers.length} CF + ${fallbackStunServers.length} fallback)`
      };

    } catch (error) {
      console.error('❌ TURN 자격증명 생성 실패 (Backend 프록시):', error);
      
      // 폴백: 공개 STUN 서버만 사용
      const fallbackServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ];

      return {
        iceServers: fallbackServers,
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        provider: 'public-stun-fallback'
      };
    }
  }

  /**
   * SFU 세션 생성 (Backend 프록시 경유)
   */
  async createSession(channelId: string, offer?: RTCSessionDescriptionInit): Promise<CloudflareSession> {
    try {
      console.log(`🎬 SFU 세션 생성 (Backend 프록시) - Channel: ${channelId}`);

      // 기존 세션 확인
      const existingSession = this.sessions.get(channelId);
      if (existingSession) {
        const isValid = await this.validateSession(existingSession.sessionId);
        if (isValid) {
          console.log(`✅ 기존 SFU 세션 재사용: ${existingSession.sessionId}`);
          return existingSession;
        } else {
          this.sessions.delete(channelId);
        }
      }

      const requestBody = offer ? {
        sessionDescription: offer
      } : {
        sessionDescription: {
          type: 'offer',
          sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:dummy\r\na=ice-pwd:dummy\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:0\r\na=sendonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=ssrc:1001 cname:dummy\r\n'
        }
      };

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/sessions/new`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Session API Proxy Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      const session: CloudflareSession = {
        sessionId: result.sessionId || channelId,
        sessionDescription: result.sessionDescription
      };

      this.sessions.set(channelId, session);
      console.log('✅ SFU 세션 생성 성공 (Backend 프록시):', session.sessionId);
      return session;

    } catch (error) {
      console.error('❌ SFU 세션 생성 실패 (Backend 프록시):', error);
      throw error;
    }
  }

  /**
   * 트랙 발행 (Backend 프록시 경유)
   */
  async publishTrack(sessionId: string, offer: RTCSessionDescriptionInit): Promise<CloudflareTrack> {
    try {
      console.log(`📺 트랙 발행 (Backend 프록시) - Session: ${sessionId}`);

      const mid = this.extractMidFromSDP(offer.sdp || '');
      const trackName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const requestBody = {
        sessionDescription: offer,
        tracks: [{
          location: 'local',
          trackName: trackName,
          mid: mid
        }]
      };

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/sessions/${sessionId}/tracks/new`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        // 410 Gone 에러인 경우 세션 만료로 간주
        if (response.status === 410) {
          console.log('🗑️ 만료된 세션 정보 삭제 중...');
          for (const [channelId, session] of this.sessions.entries()) {
            if (session.sessionId === sessionId) {
              this.sessions.delete(channelId);
              break;
            }
          }
        }
        
        throw new Error(`Track Publish API Proxy Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const track = result.tracks?.[0];

      if (!track) {
        throw new Error('트랙 응답이 비어있습니다');
      }

      const trackResult = {
        trackName: track.trackName || track.trackId,
        trackId: track.trackName || track.trackId || `track_${Date.now()}`,
        mid: mid,
        sessionDescription: track.sessionDescription
      };

      this.publishedTracks.set(sessionId, {
        trackName: trackResult.trackName,
        mid: mid
      });

      console.log('✅ 트랙 발행 성공 (Backend 프록시):', trackResult.trackName);
      return trackResult;

    } catch (error) {
      console.error('❌ 트랙 발행 실패 (Backend 프록시):', error);
      throw error;
    }
  }

  /**
   * 트랙 구독 (Backend 프록시 경유)
   */
  async subscribeToTrack(sessionId: string, trackName: string, offer: RTCSessionDescriptionInit, remoteSessionId?: string): Promise<CloudflareTrack> {
    try {
      console.log(`📡 트랙 구독 (Backend 프록시) - Session: ${sessionId}, Track: ${trackName}, RemoteSession: ${remoteSessionId}`);

      const requestBody = {
        sessionDescription: offer,
        tracks: [{
          location: 'remote',
          sessionId: remoteSessionId || sessionId, // OpenAPI 스펙에 따른 필수 필드
          trackName: trackName
        }]
      };

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/sessions/${sessionId}/tracks/new`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Track Subscribe API Proxy Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const track = result.tracks?.[0];

      if (!track) {
        throw new Error('트랙 구독 응답이 비어있습니다');
      }

      console.log('✅ 트랙 구독 성공 (Backend 프록시):', trackName);

      return {
        trackName: trackName,
        trackId: trackName,
        mid: '0',
        sessionDescription: track.sessionDescription
      };

    } catch (error) {
      console.error('❌ 트랙 구독 실패 (Backend 프록시):', error);
      throw error;
    }
  }

  /**
   * 트랙 종료 (Backend 프록시 경유)
   */
  async closeTrack(sessionId: string, trackName: string): Promise<boolean> {
    try {
      console.log(`🔚 트랙 종료 (Backend 프록시) - Session: ${sessionId}, Track: ${trackName}`);

      const trackInfo = this.publishedTracks.get(sessionId);
      const mid = trackInfo?.mid || '0';

      const requestBody = {
        tracks: [{
          mid: mid
        }],
        force: true
      };

      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/sessions/${sessionId}/tracks/close`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`트랙 종료 API 경고 (Backend 프록시): ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }

      this.publishedTracks.delete(sessionId);
      console.log('✅ 트랙 종료 성공 (Backend 프록시):', trackName);
      return true;

    } catch (error) {
      console.error('❌ 트랙 종료 실패 (Backend 프록시):', error);
      this.publishedTracks.delete(sessionId);
      return false;
    }
  }

  /**
   * 세션 유효성 검증 (Backend 프록시 경유)
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/v1/cloudflare/sessions/${sessionId}/validate`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error(`❌ 세션 유효성 검증 실패 (Backend 프록시): ${sessionId}`, error);
      return false;
    }
  }

  /**
   * SDP에서 mid 값 추출
   */
  private extractMidFromSDP(sdp: string): string {
    const midMatch = sdp.match(/a=mid:([^\s\r\n]+)/);
    return midMatch ? midMatch[1] : '0';
  }

  /**
   * 세션 정리
   */
  async cleanupSession(channelId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(channelId);
      if (session) {
        this.sessions.delete(channelId);
        this.publishedTracks.delete(session.sessionId);
        console.log('🧹 세션 정리 완료 (Backend 프록시):', session.sessionId);
      }
      return true;
    } catch (error) {
      console.error('❌ 세션 정리 실패 (Backend 프록시):', error);
      return false;
    }
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      configured: true, // Backend에서 설정 관리
      activeSessions: this.sessions.size,
      baseUrl: `${BACKEND_BASE_URL}/api/v1/cloudflare`
    };
  }
}

// 싱글톤 인스턴스 생성
export const cloudflareProxyService = new CloudflareProxyService();
export default cloudflareProxyService;