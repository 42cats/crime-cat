package com.crimecat.backend.voice.controller;

import com.crimecat.backend.voice.service.CloudflareApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Cloudflare API 프록시 컨트롤러
 * - 프론트엔드의 Cloudflare API 직접 호출을 대신하여 Backend에서 프록시 처리
 * - CORS 문제 해결 및 API 키 보안 유지
 */
@RestController
@RequestMapping("/api/v1/cloudflare")
@CrossOrigin(
    origins = {"http://localhost:3000", "https://localhost:5173", "http://localhost:5173", "https://${DOMAIN}"},
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class CloudflareProxyController {

    private final CloudflareApiService cloudflareApiService;

    public CloudflareProxyController(CloudflareApiService cloudflareApiService) {
        this.cloudflareApiService = cloudflareApiService;
    }

    /**
     * TURN 자격증명 생성 프록시
     * GET /api/v1/cloudflare/turn/credentials?userId={userId}
     */
    @GetMapping("/turn/credentials")
    public Mono<ResponseEntity<CloudflareApiService.TurnCredentialsResponse>> generateTurnCredentials(
            @RequestParam String userId) {
        
        return cloudflareApiService.generateTurnCredentials(userId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    /**
     * SFU 세션 생성 프록시
     * POST /api/v1/cloudflare/sessions/new
     */
    @PostMapping("/sessions/new")
    public Mono<ResponseEntity<CloudflareApiService.SfuSessionResponse>> createSession(
            @RequestBody CloudflareApiService.SfuSessionRequest request) {
        
        return cloudflareApiService.createSession(request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    /**
     * 트랙 발행/구독 프록시
     * POST /api/v1/cloudflare/sessions/{sessionId}/tracks/new
     */
    @PostMapping("/sessions/{sessionId}/tracks/new")
    public Mono<ResponseEntity<CloudflareApiService.TrackResponse>> publishTrack(
            @PathVariable String sessionId,
            @RequestBody CloudflareApiService.TrackRequest request) {
        
        return cloudflareApiService.publishTrack(sessionId, request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    /**
     * 트랙 종료 프록시
     * PUT /api/v1/cloudflare/sessions/{sessionId}/tracks/close
     */
    @PutMapping("/sessions/{sessionId}/tracks/close")
    public Mono<ResponseEntity<Void>> closeTrack(
            @PathVariable String sessionId,
            @RequestBody CloudflareApiService.TrackCloseRequest request) {
        
        return cloudflareApiService.closeTrack(sessionId, request)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(500).build());
    }

    /**
     * 세션 유효성 검증 프록시
     * GET /api/v1/cloudflare/sessions/{sessionId}/validate
     */
    @GetMapping("/sessions/{sessionId}/validate")
    public Mono<ResponseEntity<CloudflareApiService.SessionValidationResponse>> validateSession(
            @PathVariable String sessionId) {
        
        return cloudflareApiService.validateSession(sessionId)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.status(404).build());
    }
}