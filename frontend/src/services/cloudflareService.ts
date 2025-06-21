/**
 * Cloudflare Realtime SFU 직접 연동 서비스
 * - Signal Server 경유 없이 클라우드플레어 API 직접 호출
 * - 세션 생성, 트랙 발행/구독, TURN 자격증명 관리
 */

// 환경변수 확인
const CF_ACCOUNT_ID = import.meta.env.VITE_CF_ACCOUNT_ID;
const CF_REALTIME_APP_ID = import.meta.env.VITE_CF_REALTIME_APP_ID;
const CF_REALTIME_API_TOKEN = import.meta.env.VITE_CF_REALTIME_API_TOKEN;
const CF_TURN_KEY_ID = import.meta.env.VITE_CF_TURN_KEY_ID;
const CF_TURN_API_TOKEN = import.meta.env.VITE_CF_TURN_API_TOKEN;

// 디버깅용 환경변수 확인
console.log('🔍 Cloudflare SFU Service 초기화');
console.log('🏢 CF_ACCOUNT_ID:', CF_ACCOUNT_ID ? '설정됨' : '미설정');
console.log('📡 CF_REALTIME_APP_ID:', CF_REALTIME_APP_ID ? '설정됨' : '미설정');
console.log('🔑 CF_TURN_KEY_ID:', CF_TURN_KEY_ID ? '설정됨' : '미설정');

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

class CloudflareSFUService {
  private baseUrl = 'https://rtc.live.cloudflare.com/v1';
  private sessions = new Map<string, CloudflareSession>();
  private publishedTracks = new Map<string, { trackName: string; mid: string }>();

  /**
   * TURN 자격증명 직접 생성
   */
  async generateTurnCredentials(userId: string): Promise<TurnCredentials> {
    try {
      console.log(`🔑 TURN 자격증명 직접 생성 중... (User: ${userId})`);

      if (!CF_TURN_KEY_ID || !CF_TURN_API_TOKEN) {
        throw new Error('Cloudflare TURN 환경변수가 설정되지 않았습니다');
      }

      console.log('📤 Cloudflare TURN API 요청:', {
        url: `${this.baseUrl}/turn/keys/${CF_TURN_KEY_ID}/credentials/generate`,
        headers: {
          'Authorization': `Bearer ${CF_TURN_API_TOKEN.substring(0, 10)}...`
        },
        body: {
          ttl: 86400,
          customIdentifier: userId
        }
      });

      const response = await fetch(
        `${this.baseUrl}/turn/keys/${CF_TURN_KEY_ID}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_TURN_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ttl: 86400, // 24시간
            customIdentifier: userId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`TURN API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log('✅ TURN 자격증명 직접 생성 성공');
      console.log('📥 Cloudflare TURN API 응답:', result);
      console.log('📊 ICE Servers:', result.iceServers?.length || 0, '개');

      // iceServers가 배열인지 확인하고 변환
      let iceServers = result.iceServers || [];
      if (!Array.isArray(iceServers)) {
        console.warn('⚠️ iceServers가 배열이 아닙니다, 변환 중...');
        iceServers = [];
      }

      // 폴백 STUN 서버 추가 (항상)
      const fallbackStunServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ];

      const combinedServers = [...iceServers, ...fallbackStunServers];

      return {
        iceServers: combinedServers,
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        provider: `cloudflare+fallback (${iceServers.length} CF + ${fallbackStunServers.length} fallback)`
      };

    } catch (error) {
      console.error('❌ TURN 자격증명 생성 실패:', error);
      
      // 폴백: 공개 STUN 서버만 사용
      const fallbackServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ];

      console.log('🔄 폴백 STUN 서버 사용:', fallbackServers.length, '개');

      return {
        iceServers: fallbackServers,
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        provider: 'public-stun-fallback'
      };
    }
  }

  /**
   * Realtime 세션 생성 (채널당 하나)
   */
  async createSession(channelId: string, offer?: RTCSessionDescriptionInit): Promise<CloudflareSession> {
    try {
      console.log(`🎬 SFU 세션 생성 중... (Channel: ${channelId})`);

      // 기존 세션 확인
      const existingSession = this.sessions.get(channelId);
      if (existingSession) {
        console.log(`🔄 기존 SFU 세션 재사용: ${existingSession.sessionId}`);
        return existingSession;
      }

      if (!CF_REALTIME_APP_ID || !CF_REALTIME_API_TOKEN) {
        throw new Error('Cloudflare Realtime 환경변수가 설정되지 않았습니다');
      }

      const requestUrl = `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/new`;
      const requestBody = offer ? {
        sessionDescription: offer
      } : {
        sessionDescription: {
          type: 'offer',
          sdp: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:dummy\r\na=ice-pwd:dummy\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:0\r\na=sendonly\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=ssrc:1001 cname:dummy\r\n'
        }
      };
      
      console.log('📤 Cloudflare API 요청:', {
        url: requestUrl,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_REALTIME_API_TOKEN.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      const response = await fetch(
        requestUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_REALTIME_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorBody = await response.text();
          errorDetails = errorBody ? ` - ${errorBody}` : '';
          console.error('❌ Cloudflare API 에러 응답:', errorBody);
        } catch (e) {
          console.error('❌ 에러 응답 파싱 실패:', e);
        }
        throw new Error(`Session API Error: ${response.status} ${response.statusText}${errorDetails}`);
      }

      const result = await response.json();
      console.log('📥 Cloudflare API 응답:', result);
      
      const session: CloudflareSession = {
        sessionId: result.sessionId || channelId,
        sessionDescription: result.sessionDescription
      };

      // 세션 저장
      this.sessions.set(channelId, session);

      console.log('✅ SFU 세션 생성 성공:', session.sessionId);
      return session;

    } catch (error) {
      console.error('❌ SFU 세션 생성 실패:', error);
      throw error;
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
   * 트랙 발행 (로컬 스트림 업로드)
   */
  async publishTrack(sessionId: string, offer: RTCSessionDescriptionInit): Promise<CloudflareTrack> {
    try {
      console.log(`📺 트랙 발행 중... (Session: ${sessionId})`);

      if (!CF_REALTIME_APP_ID || !CF_REALTIME_API_TOKEN) {
        throw new Error('Cloudflare Realtime 환경변수가 설정되지 않았습니다');
      }

      // SDP에서 mid 값 추출
      const mid = this.extractMidFromSDP(offer.sdp || '');
      const trackName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔍 SDP 분석:', {
        mid: mid,
        sdpLength: offer.sdp?.length || 0,
        sdpPreview: offer.sdp?.substring(0, 200) + '...'
      });

      console.log('📤 트랙 발행 API 요청:', {
        url: `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/${sessionId}/tracks/new`,
        body: {
          sessionDescription: offer,
          tracks: [{
            location: 'local',
            trackName: trackName,
            mid: mid
          }]
        }
      });

      const response = await fetch(
        `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/${sessionId}/tracks/new`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_REALTIME_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionDescription: offer,
            tracks: [{
              location: 'local',
              trackName: trackName,
              mid: mid
            }]
          })
        }
      );

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorBody = await response.text();
          errorDetails = errorBody ? ` - ${errorBody}` : '';
          console.error('❌ 트랙 발행 API 에러 응답:', errorBody);
        } catch (e) {
          console.error('❌ 에러 응답 파싱 실패:', e);
        }
        throw new Error(`Track Publish API Error: ${response.status} ${response.statusText}${errorDetails}`);
      }

      const result = await response.json();
      console.log('📥 트랙 발행 API 응답:', result);
      
      const track = result.tracks?.[0];

      if (!track) {
        throw new Error('트랙 응답이 비어있습니다');
      }

      console.log('✅ 트랙 발행 성공:', track.trackName || track.trackId);

      const trackResult = {
        trackName: track.trackName || track.trackId,
        trackId: track.trackName || track.trackId || `track_${Date.now()}`,
        mid: mid,
        sessionDescription: track.sessionDescription
      };

      // 발행된 트랙의 mid 값 저장 (closeTrack에서 사용)
      this.publishedTracks.set(sessionId, {
        trackName: trackResult.trackName,
        mid: mid
      });

      return trackResult;

    } catch (error) {
      console.error('❌ 트랙 발행 실패:', error);
      throw error;
    }
  }

  /**
   * 트랙 구독 (원격 스트림 수신)
   */
  async subscribeToTrack(sessionId: string, trackName: string, offer: RTCSessionDescriptionInit): Promise<CloudflareTrack> {
    try {
      console.log(`📡 트랙 구독 중... (Session: ${sessionId}, Track: ${trackName})`);

      if (!CF_REALTIME_APP_ID || !CF_REALTIME_API_TOKEN) {
        throw new Error('Cloudflare Realtime 환경변수가 설정되지 않았습니다');
      }

      const response = await fetch(
        `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/${sessionId}/tracks/new`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_REALTIME_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionDescription: offer,
            tracks: [{
              location: 'remote',
              trackName: trackName
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Track Subscribe API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 트랙 구독 API 응답:', result);
      
      const track = result.tracks?.[0];

      if (!track) {
        throw new Error('트랙 구독 응답이 비어있습니다');
      }

      console.log('✅ 트랙 구독 성공:', trackName);

      return {
        trackName: trackName,
        trackId: trackName,
        sessionDescription: track.sessionDescription
      };

    } catch (error) {
      console.error('❌ 트랙 구독 실패:', error);
      throw error;
    }
  }

  /**
   * 트랙 종료
   */
  async closeTrack(sessionId: string, trackName: string): Promise<boolean> {
    try {
      console.log(`🔚 트랙 종료 중... (Session: ${sessionId}, Track: ${trackName})`);

      if (!CF_REALTIME_APP_ID || !CF_REALTIME_API_TOKEN) {
        throw new Error('Cloudflare Realtime 환경변수가 설정되지 않았습니다');
      }

      // 저장된 트랙 정보에서 mid 값 가져오기
      const trackInfo = this.publishedTracks.get(sessionId);
      if (!trackInfo) {
        console.warn('⚠️ 트랙 정보를 찾을 수 없습니다. 기본 mid 사용');
      }

      const mid = trackInfo?.mid || '0';

      console.log('📤 트랙 종료 API 요청:', {
        url: `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/${sessionId}/tracks/close`,
        body: {
          tracks: [{
            mid: mid
          }],
          force: true
        }
      });

      const response = await fetch(
        `${this.baseUrl}/apps/${CF_REALTIME_APP_ID}/sessions/${sessionId}/tracks/close`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${CF_REALTIME_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracks: [{
              mid: mid
            }],
            force: true
          })
        }
      );

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorBody = await response.text();
          errorDetails = errorBody ? ` - ${errorBody}` : '';
          console.error('❌ 트랙 종료 API 에러 응답:', errorBody);
        } catch (e) {
          console.error('❌ 에러 응답 파싱 실패:', e);
        }
        console.warn(`트랙 종료 API 경고: ${response.status} ${response.statusText}${errorDetails}`);
        return false;
      }

      console.log('✅ 트랙 종료 성공:', trackName);
      
      // 성공적으로 종료된 트랙 정보 정리
      this.publishedTracks.delete(sessionId);
      
      return true;

    } catch (error) {
      console.error('❌ 트랙 종료 실패:', error);
      
      // 에러가 발생해도 로컬에서는 트랙 정보 정리
      // (서버에서는 실패했지만 클라이언트 상태는 정리)
      this.publishedTracks.delete(sessionId);
      console.log('🧹 로컬 트랙 정보 정리 완료 (에러 발생으로 인한)');
      
      return false;
    }
  }

  /**
   * 세션 정리
   */
  async cleanupSession(channelId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(channelId);
      if (session) {
        this.sessions.delete(channelId);
        // 관련 트랙 정보도 정리
        this.publishedTracks.delete(session.sessionId);
        console.log('🧹 세션 정리 완료:', session.sessionId);
      }
      return true;
    } catch (error) {
      console.error('❌ 세션 정리 실패:', error);
      return false;
    }
  }

  /**
   * 서비스 상태 확인
   */
  getStatus() {
    return {
      configured: !!(CF_REALTIME_APP_ID && CF_REALTIME_API_TOKEN && CF_TURN_KEY_ID && CF_TURN_API_TOKEN),
      activeSessions: this.sessions.size,
      baseUrl: this.baseUrl
    };
  }
}

// 싱글톤 인스턴스 생성
export const cloudflareSFUService = new CloudflareSFUService();
export default cloudflareSFUService;