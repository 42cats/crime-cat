package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventPasswordAttempt;
import com.crimecat.backend.schedule.repository.EventPasswordAttemptRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 비밀 일정 관리 서비스
 * - 비밀번호 검증 및 보안 정책 구현
 * - Brute Force 공격 방지
 * - 세션 기반 인증 상태 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SecretScheduleService {

    private final EventPasswordAttemptRepository attemptRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    
    // 메모리 기반 차단된 IP 관리 (실제 운영 환경에서는 Redis 사용 권장)
    private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();
    
    // 보안 설정 상수
    private static final int MAX_ATTEMPTS_PER_IP = 5;
    private static final int MAX_ATTEMPTS_PER_USER = 3;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 5;
    private static final int IP_BLOCK_DURATION_MINUTES = 15;
    private static final String VERIFIED_EVENTS_SESSION_KEY = "verified_secret_events";

    /**
     * 비밀번호 검증 및 보안 정책 적용
     */
    @Transactional
    public PasswordVerificationResult verifyPassword(
            Event event, 
            String inputPassword, 
            WebUser user,
            HttpServletRequest request) {
        
        String clientIp = getClientIpAddress(request);
        String userAgent = getUserAgent(request);
        
        // 1. 기본 검증
        if (event == null || !event.isSecretEvent()) {
            return PasswordVerificationResult.createError("비밀 일정이 아닙니다.");
        }
        
        if (!event.hasPassword()) {
            return PasswordVerificationResult.createError("비밀번호가 설정되지 않았습니다.");
        }
        
        if (inputPassword == null || inputPassword.trim().isEmpty()) {
            logFailedAttempt(event, user, clientIp, userAgent, "빈 비밀번호");
            return PasswordVerificationResult.createError("비밀번호를 입력해주세요.");
        }
        
        // 2. Rate Limiting 검사
        RateLimitResult rateLimitResult = checkRateLimit(event, user, clientIp);
        if (rateLimitResult.isBlocked()) {
            logFailedAttempt(event, user, clientIp, userAgent, "Rate Limit 초과");
            return PasswordVerificationResult.createRateLimited(rateLimitResult.getMessage());
        }
        
        // 3. 비밀번호 검증
        boolean isValidPassword = passwordEncoder.matches(inputPassword, event.getSecretPassword());
        
        if (isValidPassword) {
            // 성공 기록
            String sessionId = generateSessionId();
            logSuccessfulAttempt(event, user, clientIp, userAgent, sessionId);
            markEventAsVerifiedInSession(request.getSession(), event.getId());
            
            log.info("비밀 일정 인증 성공: eventId={}, userId={}, ip={}", 
                     event.getId(), 
                     user != null ? user.getId() : "anonymous", 
                     clientIp);
            
            return PasswordVerificationResult.createSuccess(sessionId);
        } else {
            // 실패 기록
            logFailedAttempt(event, user, clientIp, userAgent, "잘못된 비밀번호");
            
            log.warn("비밀 일정 인증 실패: eventId={}, userId={}, ip={}", 
                     event.getId(), 
                     user != null ? user.getId() : "anonymous", 
                     clientIp);
            
            return PasswordVerificationResult.createError("올바르지 않은 비밀번호입니다.");
        }
    }

    /**
     * 세션에서 이벤트 인증 상태 확인
     */
    public boolean isEventVerifiedInSession(HttpSession session, UUID eventId) {
        if (session == null || eventId == null) {
            return false;
        }
        
        @SuppressWarnings("unchecked")
        Set<UUID> verifiedEvents = (Set<UUID>) session.getAttribute(VERIFIED_EVENTS_SESSION_KEY);
        
        return verifiedEvents != null && verifiedEvents.contains(eventId);
    }

    /**
     * 비밀번호 복잡도 검증
     */
    public PasswordComplexityResult validatePasswordComplexity(String password) {
        if (password == null) {
            return PasswordComplexityResult.invalid("비밀번호가 필요합니다.");
        }
        
        if (password.length() < 4) {
            return PasswordComplexityResult.invalid("비밀번호는 최소 4자 이상이어야 합니다.");
        }
        
        if (password.length() > 50) {
            return PasswordComplexityResult.invalid("비밀번호는 최대 50자까지 가능합니다.");
        }
        
        return PasswordComplexityResult.valid();
    }

    /**
     * 비밀번호 해시화
     */
    public String hashPassword(String plainPassword) {
        return passwordEncoder.encode(plainPassword);
    }

    /**
     * 이벤트 인증 통계 조회 (관리자용)
     */
    public EventSecurityStats getEventSecurityStats(UUID eventId) {
        long totalAttempts = attemptRepository.countAllAttemptsByEvent(eventId);
        long successfulAttempts = attemptRepository.countSuccessfulAttemptsByEvent(eventId);
        long failedAttempts = totalAttempts - successfulAttempts;
        
        return EventSecurityStats.builder()
                .eventId(eventId)
                .totalAttempts(totalAttempts)
                .successfulAttempts(successfulAttempts)
                .failedAttempts(failedAttempts)
                .build();
    }

    /**
     * Rate Limiting 검사
     */
    private RateLimitResult checkRateLimit(Event event, WebUser user, String clientIp) {
        LocalDateTime timeWindow = LocalDateTime.now().minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        
        // IP 기반 제한
        long ipAttempts = attemptRepository.countFailedAttemptsByIpSince(clientIp, timeWindow);
        if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
            blockedIps.add(clientIp);
            return RateLimitResult.blocked(String.format(
                "IP 주소가 일시적으로 차단되었습니다. %d분 후 다시 시도해주세요.", 
                IP_BLOCK_DURATION_MINUTES));
        }
        
        // 사용자 기반 제한 (로그인된 경우)
        if (user != null) {
            long userAttempts = attemptRepository.countFailedAttemptsByUserSince(
                user.getId(), timeWindow);
            if (userAttempts >= MAX_ATTEMPTS_PER_USER) {
                return RateLimitResult.blocked(
                    "계정이 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.");
            }
        }
        
        // 이벤트별 IP 제한
        long eventIpAttempts = attemptRepository.countFailedAttemptsByEventAndIpSince(
            event.getId(), clientIp, timeWindow);
        if (eventIpAttempts >= MAX_ATTEMPTS_PER_IP) {
            return RateLimitResult.blocked(
                "이 이벤트에 대한 접근이 일시적으로 제한되었습니다.");
        }
        
        return RateLimitResult.allowed();
    }

    /**
     * 실패한 시도 기록
     */
    @Transactional
    private void logFailedAttempt(Event event, WebUser user, String clientIp, String userAgent, String reason) {
        EventPasswordAttempt attempt = user != null ? 
            EventPasswordAttempt.createFailedAttempt(event, user, clientIp, userAgent) :
            EventPasswordAttempt.createAnonymousFailedAttempt(event, clientIp, userAgent);
            
        attemptRepository.save(attempt);
        
        log.warn("비밀번호 입력 실패: eventId={}, userId={}, ip={}, reason={}", 
                 event.getId(), 
                 user != null ? user.getId() : "anonymous", 
                 clientIp, 
                 reason);
    }

    /**
     * 성공한 시도 기록
     */
    @Transactional
    private void logSuccessfulAttempt(Event event, WebUser user, String clientIp, String userAgent, String sessionId) {
        EventPasswordAttempt attempt = user != null ? 
            EventPasswordAttempt.createSuccessAttempt(event, user, clientIp, userAgent, sessionId) :
            EventPasswordAttempt.createAnonymousSuccessAttempt(event, clientIp, userAgent, sessionId);
            
        attemptRepository.save(attempt);
    }

    /**
     * 세션에 인증된 이벤트 ID 추가
     */
    @SuppressWarnings("unchecked")
    private void markEventAsVerifiedInSession(HttpSession session, UUID eventId) {
        Set<UUID> verifiedEvents = (Set<UUID>) session.getAttribute(VERIFIED_EVENTS_SESSION_KEY);
        if (verifiedEvents == null) {
            verifiedEvents = ConcurrentHashMap.newKeySet();
            session.setAttribute(VERIFIED_EVENTS_SESSION_KEY, verifiedEvents);
        }
        verifiedEvents.add(eventId);
    }

    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * User-Agent 추출
     */
    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    /**
     * 세션 ID 생성
     */
    private String generateSessionId() {
        return UUID.randomUUID().toString();
    }

    // 결과 클래스들
    public static class PasswordVerificationResult {
        private final boolean success;
        private final boolean rateLimited;
        private final String message;
        private final String sessionId;

        private PasswordVerificationResult(boolean success, boolean rateLimited, String message, String sessionId) {
            this.success = success;
            this.rateLimited = rateLimited;
            this.message = message;
            this.sessionId = sessionId;
        }

        public static PasswordVerificationResult createSuccess(String sessionId) {
            return new PasswordVerificationResult(true, false, "인증 성공", sessionId);
        }

        public static PasswordVerificationResult createError(String message) {
            return new PasswordVerificationResult(false, false, message, null);
        }

        public static PasswordVerificationResult createRateLimited(String message) {
            return new PasswordVerificationResult(false, true, message, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public boolean isRateLimited() { return rateLimited; }
        public String getMessage() { return message; }
        public String getSessionId() { return sessionId; }
    }

    public static class PasswordComplexityResult {
        private final boolean valid;
        private final String message;

        private PasswordComplexityResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public static PasswordComplexityResult valid() {
            return new PasswordComplexityResult(true, "유효한 비밀번호입니다.");
        }

        public static PasswordComplexityResult invalid(String message) {
            return new PasswordComplexityResult(false, message);
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }

    private static class RateLimitResult {
        private final boolean blocked;
        private final String message;

        private RateLimitResult(boolean blocked, String message) {
            this.blocked = blocked;
            this.message = message;
        }

        public static RateLimitResult allowed() {
            return new RateLimitResult(false, "허용됨");
        }

        public static RateLimitResult blocked(String message) {
            return new RateLimitResult(true, message);
        }

        public boolean isBlocked() { return blocked; }
        public String getMessage() { return message; }
    }

    public static class EventSecurityStats {
        private UUID eventId;
        private long totalAttempts;
        private long successfulAttempts;
        private long failedAttempts;

        public static EventSecurityStatsBuilder builder() {
            return new EventSecurityStatsBuilder();
        }

        // Getters and Builder
        public UUID getEventId() { return eventId; }
        public long getTotalAttempts() { return totalAttempts; }
        public long getSuccessfulAttempts() { return successfulAttempts; }
        public long getFailedAttempts() { return failedAttempts; }

        public static class EventSecurityStatsBuilder {
            private UUID eventId;
            private long totalAttempts;
            private long successfulAttempts;
            private long failedAttempts;

            public EventSecurityStatsBuilder eventId(UUID eventId) {
                this.eventId = eventId;
                return this;
            }

            public EventSecurityStatsBuilder totalAttempts(long totalAttempts) {
                this.totalAttempts = totalAttempts;
                return this;
            }

            public EventSecurityStatsBuilder successfulAttempts(long successfulAttempts) {
                this.successfulAttempts = successfulAttempts;
                return this;
            }

            public EventSecurityStatsBuilder failedAttempts(long failedAttempts) {
                this.failedAttempts = failedAttempts;
                return this;
            }

            public EventSecurityStats build() {
                EventSecurityStats stats = new EventSecurityStats();
                stats.eventId = this.eventId;
                stats.totalAttempts = this.totalAttempts;
                stats.successfulAttempts = this.successfulAttempts;
                stats.failedAttempts = this.failedAttempts;
                return stats;
            }
        }
    }
}