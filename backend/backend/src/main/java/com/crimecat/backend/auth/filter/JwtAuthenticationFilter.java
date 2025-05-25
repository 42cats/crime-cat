package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.utils.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    private final JwtBlacklistService jwtBlacklistService;
    private final RefreshTokenService refreshTokenService;
    private final WebUserService webUserService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain) throws ServletException, IOException {

        log.info("🔵 Incoming Request URI = {}", request.getRequestURI());
        // 인증 제외 경로
        if (isExcludedPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        // public api 중 인증 정보가 필요한 경우를 위해 로그인 토큰 처리
        if (request.getRequestURI().startsWith("/api/v1/public/")) {
            String accessToken = extractAccessToken(request);
            if (accessToken == null || !jwtTokenProvider.validateToken(accessToken)
            || jwtBlacklistService.isBlacklisted(accessToken) || jwtTokenProvider.isTokenExpired(accessToken)) {
                filterChain.doFilter(request, response);
                return;
            }
            String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            Optional<WebUser> optUser = webUserRepository.findById(UUID.fromString(userId));
            if (optUser.isPresent()) {
                WebUser webUser = optUser.get();
                // 차단 상태 확인 및 자동 해제 처리
                if (isUserBlocked(webUser)) {
                    log.warn("🚫 User {} is blocked. Access denied.", webUser.getNickname());
                    // public API이므로 인증 없이 진행
                } else {
                    authenticateUser(webUser, request);
                }
            }
            filterChain.doFilter(request, response);
            return;
        }


        String accessToken = extractAccessToken(request);

        if (accessToken == null) {
            unauthorized(response, "Access token not found");
            return;
        }

        if (!jwtTokenProvider.validateToken(accessToken)) {
            unauthorized(response, "Access token invalid");
            return;
        }
        if (jwtBlacklistService.isBlacklisted(accessToken)) {
            unauthorized(response, "Access token blacklisted");
            return;
        }
        if (jwtTokenProvider.isTokenExpired(accessToken)) {
            unauthorized(response, "Access token expired");
            return;
        }
        String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
        Optional<WebUser> optUser = webUserRepository.findById(UUID.fromString(userId));
        if (optUser.isEmpty()) {
            unauthorized(response, "User not found");
            return;
        }
        WebUser webUser = optUser.get();
        log.info("🔍 Found user: {} (ID: {}), isBanned: {}, blockReason: {}, blockExpiresAt: {}",
                 webUser.getNickname(), webUser.getId(), webUser.getIsBanned(),
                 webUser.getBlockReason(), webUser.getBlockExpiresAt());

        // 차단 상태 확인 및 자동 해제 처리
        if (isUserBlocked(webUser)) {
            log.warn("🚫 User {} is blocked. Access denied.", webUser.getNickname());
            unauthorized(response, "User account is blocked");
            return;
        }

        authenticateUser(webUser, request);
        filterChain.doFilter(request, response);
    }

    private boolean isExcludedPath(String uri) {
        return uri.startsWith("/bot/v1/")
            || uri.startsWith("/login")
            || uri.startsWith("/api/v1/auth/reissue")
            || uri.startsWith("/api/v1/auth/logout")
            || uri.startsWith("/actuator/health")
            || uri.startsWith("/actuator/info")
            || uri.startsWith("/api/v1/csrf/token");
    }

    private String extractAccessToken(HttpServletRequest request) {
        return TokenCookieUtil.getCookieValue(request, "Authorization");
    }

    private void authenticateUser(WebUser webUser, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                webUser,                    // WebUser 직접 사용
                null,
                webUser.getAuthorities()
            );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.info("✅ Authentication set for userId = {}", webUser.getId());
    }

    /**
     * 사용자의 차단 상태를 확인하고 만료된 차단을 자동 해제합니다.
     */
    private boolean isUserBlocked(WebUser webUser) {
        if (!webUser.getIsBanned()) {
            return false;
        }

        // 영구 차단인 경우
        if (webUser.getBlockExpiresAt() == null) {
            return true;
        }

        // 차단 기간이 만료된 경우 자동 해제
        if (java.time.LocalDateTime.now().isAfter(webUser.getBlockExpiresAt())) {
            try {
                webUserService.unblockUser(webUser.getId());
                log.info("✅ User {} block has expired and been automatically removed.", webUser.getNickname());
                return false;
            } catch (Exception e) {
                log.error("❌ Failed to auto-unblock user {}: {}", webUser.getNickname(), e.getMessage());
                // 오류 발생 시 안전을 위해 차단 상태 유지
                return true;
            }
        }

        return true;
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
