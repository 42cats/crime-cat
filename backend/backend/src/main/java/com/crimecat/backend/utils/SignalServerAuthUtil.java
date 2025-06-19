package com.crimecat.backend.utils;

import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Signal Server에서 오는 요청의 사용자 인증을 처리하는 유틸리티 클래스
 * 
 * Signal Server는 다음과 같은 헤더 구조로 요청을 보냅니다:
 * - Authorization: Bearer {SIGNAL_SERVER_SECRET_TOKEN}
 * - X-User-ID: {실제 사용자 ID}
 * - X-User-Token: {사용자 JWT 토큰}
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SignalServerAuthUtil {

    private final WebUserRepository webUserRepository;

    /**
     * Signal Server 요청 헤더에서 사용자 정보를 추출합니다.
     * 
     * @param request HTTP 요청 객체
     * @return 인증된 WebUser 객체
     * @throws IllegalArgumentException X-User-ID 헤더가 없는 경우
     * @throws RuntimeException 사용자를 찾을 수 없는 경우
     */
    public WebUser extractUserFromHeaders(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-User-ID");
        String userTokenHeader = request.getHeader("X-User-Token");
        
        log.info("🔍 Signal Server request - User ID: {}, Token present: {}", 
                userIdHeader, userTokenHeader != null);
        
        if (userIdHeader == null || userIdHeader.trim().isEmpty()) {
            log.error("❌ Missing X-User-ID header in Signal Server request");
            throw new IllegalArgumentException("X-User-ID header is required for Signal Server requests");
        }
        
        try {
            UUID userId = UUID.fromString(userIdHeader.trim());
            
            WebUser user = webUserRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("❌ User not found for ID: {}", userId);
                    return new RuntimeException("User not found: " + userId);
                });
            
            log.info("✅ Signal Server authentication successful for user: {} (ID: {})", 
                    user.getNickname(), user.getId());
            
            return user;
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Invalid UUID format in X-User-ID header: {}", userIdHeader);
            throw new IllegalArgumentException("Invalid user ID format: " + userIdHeader);
        }
    }

    /**
     * Signal Server 요청에서 사용자 ID를 추출합니다 (WebUser 조회 없이)
     * 
     * @param request HTTP 요청 객체
     * @return 사용자 UUID
     */
    public UUID extractUserIdFromHeaders(HttpServletRequest request) {
        String userIdHeader = request.getHeader("X-User-ID");
        
        if (userIdHeader == null || userIdHeader.trim().isEmpty()) {
            throw new IllegalArgumentException("X-User-ID header is required");
        }
        
        try {
            return UUID.fromString(userIdHeader.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid user ID format: " + userIdHeader);
        }
    }

    /**
     * Signal Server 요청의 사용자 토큰을 추출합니다 (검증용)
     * 
     * @param request HTTP 요청 객체
     * @return 사용자 JWT 토큰 (없으면 null)
     */
    public String extractUserTokenFromHeaders(HttpServletRequest request) {
        return request.getHeader("X-User-Token");
    }

    /**
     * 요청이 Signal Server에서 온 것인지 확인합니다.
     * 
     * @param request HTTP 요청 객체
     * @return Signal Server 요청 여부
     */
    public boolean isSignalServerRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String userIdHeader = request.getHeader("X-User-ID");
        
        return authHeader != null && 
               authHeader.startsWith("Bearer ") && 
               userIdHeader != null;
    }

    /**
     * Signal Server 요청 로깅용 메소드
     * 
     * @param request HTTP 요청 객체
     * @param action 수행 중인 액션
     */
    public void logSignalServerRequest(HttpServletRequest request, String action) {
        String userId = request.getHeader("X-User-ID");
        String method = request.getMethod();
        String uri = request.getRequestURI();
        
        log.info("📡 Signal Server {} - {} {} (User: {})", action, method, uri, userId);
    }
}