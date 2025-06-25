package com.crimecat.backend.voice.service;

import com.crimecat.backend.api.AbstractApiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Cloudflare API 프록시 서비스
 * - 프론트엔드에서 직접 호출하지 못하는 Cloudflare API를 Backend에서 프록시
 * - CORS 문제 해결 및 API 키 보안 강화
 */
@Service
public class CloudflareApiService extends AbstractApiService {

    @Value("${cloudflare.realtime.app-id}")
    private String cfAppId;

    @Value("${cloudflare.realtime.api-token}")
    private String cfApiToken;

    @Value("${cloudflare.turn.key-id}")
    private String cfTurnKeyId;

    @Value("${cloudflare.turn.api-token}")
    private String cfTurnApiToken;

    private static final String CLOUDFLARE_RTC_BASE_URL = "https://rtc.live.cloudflare.com/v1";

    public CloudflareApiService(WebClient.Builder webClientBuilder) {
        super(CLOUDFLARE_RTC_BASE_URL, webClientBuilder);
    }

    /**
     * TURN 자격증명 생성
     */
    public Mono<TurnCredentialsResponse> generateTurnCredentials(String userId) {
        return webClient.post()
                .uri("/turn/keys/{keyId}/credentials/generate", cfTurnKeyId)
                .header("Authorization", "Bearer " + cfTurnApiToken)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "ttl", 86400,
                        "customIdentifier", userId
                ))
                .retrieve()
                .bodyToMono(TurnCredentialsResponse.class);
    }

    /**
     * SFU 세션 생성
     */
    public Mono<SfuSessionResponse> createSession(SfuSessionRequest request) {
        return webClient.post()
                .uri("/apps/{appId}/sessions/new", cfAppId)
                .header("Authorization", "Bearer " + cfApiToken)
                .header("Content-Type", "application/json")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(SfuSessionResponse.class);
    }

    /**
     * 트랙 발행/구독
     */
    public Mono<TrackResponse> publishTrack(String sessionId, TrackRequest request) {
        return webClient.post()
                .uri("/apps/{appId}/sessions/{sessionId}/tracks/new", cfAppId, sessionId)
                .header("Authorization", "Bearer " + cfApiToken)
                .header("Content-Type", "application/json")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(TrackResponse.class);
    }

    /**
     * 트랙 종료
     */
    public Mono<Void> closeTrack(String sessionId, TrackCloseRequest request) {
        return webClient.put()
                .uri("/apps/{appId}/sessions/{sessionId}/tracks/close", cfAppId, sessionId)
                .header("Authorization", "Bearer " + cfApiToken)
                .header("Content-Type", "application/json")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Void.class);
    }

    /**
     * 세션 유효성 검증
     */
    public Mono<SessionValidationResponse> validateSession(String sessionId) {
        return webClient.get()
                .uri("/apps/{appId}/sessions/{sessionId}", cfAppId, sessionId)
                .header("Authorization", "Bearer " + cfApiToken)
                .retrieve()
                .bodyToMono(SessionValidationResponse.class);
    }

    // DTO 클래스들
    public static class TurnCredentialsResponse {
        private Object iceServers;
        private String expiresAt;

        public Object getIceServers() { return iceServers; }
        public void setIceServers(Object iceServers) { this.iceServers = iceServers; }
        public String getExpiresAt() { return expiresAt; }
        public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    }

    public static class SfuSessionRequest {
        private Object sessionDescription;

        public Object getSessionDescription() { return sessionDescription; }
        public void setSessionDescription(Object sessionDescription) { this.sessionDescription = sessionDescription; }
    }

    public static class SfuSessionResponse {
        private String sessionId;
        private Object sessionDescription;

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public Object getSessionDescription() { return sessionDescription; }
        public void setSessionDescription(Object sessionDescription) { this.sessionDescription = sessionDescription; }
    }

    public static class TrackRequest {
        private Object sessionDescription;
        private Object[] tracks;

        public Object getSessionDescription() { return sessionDescription; }
        public void setSessionDescription(Object sessionDescription) { this.sessionDescription = sessionDescription; }
        public Object[] getTracks() { return tracks; }
        public void setTracks(Object[] tracks) { this.tracks = tracks; }
    }

    public static class TrackResponse {
        private Object[] tracks;
        private Object sessionDescription;

        public Object[] getTracks() { return tracks; }
        public void setTracks(Object[] tracks) { this.tracks = tracks; }
        public Object getSessionDescription() { return sessionDescription; }
        public void setSessionDescription(Object sessionDescription) { this.sessionDescription = sessionDescription; }
    }

    public static class TrackCloseRequest {
        private Object[] tracks;
        private boolean force;

        public Object[] getTracks() { return tracks; }
        public void setTracks(Object[] tracks) { this.tracks = tracks; }
        public boolean isForce() { return force; }
        public void setForce(boolean force) { this.force = force; }
    }

    public static class SessionValidationResponse {
        private String sessionId;
        private String status;

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}