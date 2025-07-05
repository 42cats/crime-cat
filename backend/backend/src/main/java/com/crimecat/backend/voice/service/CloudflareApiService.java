package com.crimecat.backend.voice.service;

import com.crimecat.backend.api.AbstractApiService;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Cloudflare API 프록시 서비스
 * - 프론트엔드에서 직접 호출하지 못하는 Cloudflare API를 Backend에서 프록시
 * - CORS 문제 해결 및 API 키 보안 강화
 */
@Service
public class CloudflareApiService extends AbstractApiService {

    private static final Logger log = LoggerFactory.getLogger(CloudflareApiService.class);

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
     * 환경변수 검증
     */
    @PostConstruct
    public void validateCloudflareConfig() {
        log.info("🔧 Cloudflare API 설정 검증 중...");
        
        if (!StringUtils.hasText(cfAppId)) {
            throw new IllegalStateException("❌ CF_REALTIME_APP_ID 환경변수가 설정되지 않았습니다");
        }
        if (!StringUtils.hasText(cfApiToken)) {
            throw new IllegalStateException("❌ CF_REALTIME_API_TOKEN 환경변수가 설정되지 않았습니다");
        }
        if (!StringUtils.hasText(cfTurnKeyId)) {
            throw new IllegalStateException("❌ CF_TURN_KEY_ID 환경변수가 설정되지 않았습니다");
        }
        if (!StringUtils.hasText(cfTurnApiToken)) {
            throw new IllegalStateException("❌ CF_TURN_API_TOKEN 환경변수가 설정되지 않았습니다");
        }
        
        log.info("✅ Cloudflare 설정 검증 완료");
        log.info("🆔 App ID: {}", cfAppId);
        log.info("🔑 API Token: {}***", cfApiToken.substring(0, Math.min(8, cfApiToken.length())));
        log.info("🗝️ TURN Key ID: {}", cfTurnKeyId);
        log.info("🔐 TURN Token: {}***", cfTurnApiToken.substring(0, Math.min(8, cfTurnApiToken.length())));
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
        log.info("🌐 Cloudflare SFU 세션 생성 시작");
        log.debug("📋 요청 SDP: {}", request.getSessionDescription());
        
        return webClient.post()
                .uri("/apps/{appId}/sessions/new", cfAppId)
                .header("Authorization", "Bearer " + cfApiToken)
                .header("Content-Type", "application/json")
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> {
                    log.error("🚨 Cloudflare SFU API 에러 - Status: {}", response.statusCode());
                    return response.bodyToMono(String.class)
                            .map(body -> {
                                log.error("🚨 Cloudflare API 에러 응답: {}", body);
                                return new RuntimeException(String.format(
                                    "Cloudflare SFU API 실패: %s - %s", 
                                    response.statusCode().value(),
                                    body
                                ));
                            });
                })
                .bodyToMono(SfuSessionResponse.class)
                .doOnSuccess(response -> {
                    log.info("✅ SFU 세션 생성 성공: {}", response.getSessionId());
                })
                .doOnError(error -> {
                    log.error("❌ SFU 세션 생성 실패", error);
                });
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