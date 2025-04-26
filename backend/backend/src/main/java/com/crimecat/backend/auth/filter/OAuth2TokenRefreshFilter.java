package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.DiscordRedisTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.config.ServiceUrlConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2TokenRefreshFilter extends OncePerRequestFilter {

    private final DiscordRedisTokenService discordRedisTokenService;
    private final ServiceUrlConfig serviceUrlConfig;

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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null &&
                authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof DiscordOAuth2User) {

            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            String userId = user.getName(); // UUID (DB 상의 사용자 ID)

            String accessToken = discordRedisTokenService.getAccessToken(userId);

            if (accessToken == null) {
                log.info("🔁 Discord AccessToken 만료 감지됨 - 사용자 ID: {}", userId);

                SecurityContextHolder.clearContext(); // 인증 정보 삭제
                TokenCookieUtil.clearAuthCookies(response); // 쿠키 삭제

                try {
                    String baseUrl = "https://crimecat.org";
                    response.sendRedirect(baseUrl + "/login");
                } catch (Exception e) {
                    log.warn("❌ 디스코드 토큰 만료 리디렉션 실패: {}", e.toString());
                }

                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
