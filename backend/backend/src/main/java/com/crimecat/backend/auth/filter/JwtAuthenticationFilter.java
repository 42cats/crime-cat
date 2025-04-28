package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
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

    @Override
    protected void doFilterInternal(HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain) throws ServletException, IOException {

        // 인증 제외 경로
        if (isExcludedPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        log.info("🔵 Incoming Request URI = {}", request.getRequestURI());

        String accessToken = extractAccessToken(request);

        if (accessToken == null) {
            unauthorized(response, "Access token not found");
            return;
        }

        if (!jwtTokenProvider.validateToken(accessToken)) {
            if (jwtTokenProvider.isTokenExpired(accessToken)) {
                if (!tryReissueTokens(request, response)) {
                    unauthorized(response, "Refresh token invalid or expired");
                    return;
                }
                return; // 새로 인증 완료했으므로 이번 요청은 여기서 끝
            }
            unauthorized(response, "Access token invalid");
            return;
        }

        if (jwtBlacklistService.isBlacklisted(accessToken)) {
            unauthorized(response, "Access token blacklisted");
            return;
        }

        authenticateUserFromToken(accessToken, request);
        filterChain.doFilter(request, response);
    }

    private boolean isExcludedPath(String uri) {
        return uri.startsWith("/bot/v1/")
            || uri.startsWith("/login/oauth2/")
            || uri.startsWith("/actuator/health")
            || uri.startsWith("/actuator/info")
            || uri.startsWith("/api/v1/public/");
    }

    private String extractAccessToken(HttpServletRequest request) {
        String token = TokenCookieUtil.getCookieValue(request, "Authorization");

        if (token == null) {
            String bearer = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (bearer != null && bearer.startsWith("Bearer ")) {
                token = bearer.substring(7);
            }
        }

        return token;
    }

    private boolean tryReissueTokens(HttpServletRequest request, HttpServletResponse response) {
        try {
            String expiredAccessToken = extractAccessToken(request);
            String userId = jwtTokenProvider.getUserIdFromToken(expiredAccessToken);

            WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asException);

            String refreshToken = TokenCookieUtil.getCookieValue(request, "RefreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                log.warn("🔴 RefreshToken not found in cookie");
                return false;
            }

            String refreshTokenFromRedis = refreshTokenService.getRefreshToken(userId);
            if (refreshTokenFromRedis == null || !refreshTokenFromRedis.equals(refreshToken)) {
                log.warn("🔴 RefreshToken mismatch or not found in Redis");
                return false;
            }

            // 새 AccessToken, RefreshToken 발급
            String newAccessToken = jwtTokenProvider.createAccessToken(
                webUser.getId().toString(),
                webUser.getNickname(),
                webUser.getDiscordUserSnowflake()
            );

            String newRefreshToken = jwtTokenProvider.createRefreshToken(webUser.getId().toString());

            log.info("✅ New AccessToken and RefreshToken generated");

            // RefreshToken 갱신
            refreshTokenService.saveRefreshToken(webUser.getId().toString(), newRefreshToken);
            log.info("💾 RefreshToken updated in Redis");

            // 기존 쿠키 클리어 + 새 쿠키 세팅
            TokenCookieUtil.clearAuthCookies(response);
            response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(newAccessToken));
            response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createRefreshCookie(newRefreshToken));

            // 새 AccessToken으로 인증 설정
            authenticateUser(webUser, request);

            return true;
        } catch (Exception e) {
            log.error("❌ Failed to reissue tokens", e);
            return false;
        }
    }

    private void authenticateUserFromToken(String token, HttpServletRequest request) {
        String userId = jwtTokenProvider.getUserIdFromToken(token);

        WebUser webUser = webUserRepository.findById(UUID.fromString(userId))
            .orElseThrow(ErrorStatus.USER_NOT_FOUND::asException);

        authenticateUser(webUser, request);
    }

    private void authenticateUser(WebUser webUser, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                new DiscordOAuth2User(webUser, null, null),
                null,
                webUser.getAuthorities()
            );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.info("✅ Authentication set for userId = {}", webUser.getId());
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
