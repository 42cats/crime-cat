package com.crimecat.backend.auth.filter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    private final JwtBlacklistService jwtBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

    // 인증 제외 경로
    if (request.getRequestURI().startsWith("/bot/v1/")
        || request.getRequestURI().startsWith("/login/oauth2/")
        || request.getRequestURI().startsWith("/actuator/health")
        || request.getRequestURI().startsWith("/actuator/info")
        ||(request.getRequestURI().startsWith("/api/v1/public/"))
        ) {
        filterChain.doFilter(request, response);
        return;
    }

    log.info("Request = {}", request);

    String token = TokenCookieUtil.getCookieValue(request, "Authorization");

    // Authorization 헤더에서도 검사 (Bearer 지원)
    if (token == null) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            token = bearer.substring(7);
        }
    }

    if (token == null) {
        unauthorized(response, "Access token not found");
        return;
    }

    if (!jwtTokenProvider.validateToken(token)) {
        unauthorized(response, "Invalid token");
        return;
    }

    if (jwtBlacklistService.isBlacklisted(token)) {
        unauthorized(response, "Token is blacklisted");
        return;
    }

    String userId = jwtTokenProvider.getUserIdFromToken(token);
    log.info("✅ Extracted userId: {}", userId);

    Optional<WebUser> user = webUserRepository.findById(UUID.fromString(userId));
    if (user.isEmpty()) {
        log.warn("유저 디비에 없음, 인증 실패");
        TokenCookieUtil.clearAuthCookies(response);
        unauthorized(response, "User not found");
        return;
    }

    WebUser webUser = user.get();

    UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                    new DiscordOAuth2User(webUser, null, null),
                    null,
                    webUser.getAuthorities()
            );
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);

    filterChain.doFilter(request, response);
}

private void unauthorized(HttpServletResponse response, String message) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response.getWriter().write("{\"error\": \"" + message + "\"}");
}

}
