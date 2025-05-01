package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.utils.TokenCookieUtil;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
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

        authenticateUserFromToken(accessToken, request);
        filterChain.doFilter(request, response);
    }

    private boolean isExcludedPath(String uri) {
        return uri.startsWith("/bot/v1/")
            || uri.startsWith("/login/")
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
