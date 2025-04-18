package com.crimecat.backend.auth.filter;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

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

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication != null && authentication.isAuthenticated()
            && authentication.getPrincipal() instanceof DiscordOAuth2User){
            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            Instant expiresAt = user.getExpiresAt();

        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof DiscordOAuth2User) {

            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            String userId = user.getName(); // userId는 UUID (DB ID)

            String accessToken = discordRedisTokenService.getAccessToken(userId);

            if (accessToken == null) {
                log.info("🔁 discord AccessToken 만료 감지됨 - 사용자 ID: {}", userId);
                try {
                    SecurityContextHolder.clearContext();

                    // 🧹 쿠키까지 삭제
                    TokenCookieUtil.clearAuthCookies(response);

                    // 🌐 프론트 로그인 페이지로 리디렉션
                    String baseUrl = serviceUrlConfig.getDomain();
                    response.sendRedirect(baseUrl + "/login");
                    return;

                } catch (Exception e) {
                    log.warn("❌ 디스코드 토큰 만료 리디렉션 에러: {}", e.toString());
                    return;
                }
            }

        }

        filterChain.doFilter(request, response);
    }
}
