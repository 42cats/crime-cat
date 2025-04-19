package com.crimecat.backend.auth.filter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.crimecat.backend.auth.dto.DiscordTokenResponse;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.DiscordTokenService;
import com.crimecat.backend.auth.service.DiscordRedisTokenService;
import com.crimecat.backend.auth.dto.DiscordTokenResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2TokenRefreshFilter extends OncePerRequestFilter {

    private final DiscordTokenService discordTokenService;
    private final DiscordRedisTokenService discordRedisTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof DiscordOAuth2User) {

            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            String userId = user.getName(); // userId는 UUID (DB ID)

            String accessToken = discordRedisTokenService.getAccessToken(userId);
            String refreshToken = discordRedisTokenService.getRefreshToken(userId);

            if (accessToken == null && refreshToken != null) {
                log.info("🔁 AccessToken 만료 감지됨 - 사용자 ID: {}", userId);

                try {
                    DiscordTokenResponse discordTokenResponse = discordTokenService.refreshAccessToken(refreshToken);
                    String newAccessToken = discordTokenResponse.getAccessToken();
                    String newRefreshToken = discordTokenResponse.getRefreshToken();
                    Instant expireAt = Instant.now().plusSeconds(discordTokenResponse.getExpiresIn());

                    // Redis에 갱신된 토큰 저장
                    discordRedisTokenService.saveAccessToken(userId, newAccessToken, discordTokenResponse.getExpiresIn());
                    discordRedisTokenService.saveRefreshToken(userId, newRefreshToken);

                    // SecurityContext에 사용자 재설정 (accessToken 없이도 사용 가능)
                    DiscordOAuth2User newUser = new DiscordOAuth2User(
                            user.getWebUser(),
                            user.getAttributes(),
                            user.getAuthorities(),
                            newAccessToken,
                            newRefreshToken
                            ,expireAt);
                    Authentication newAuth = new UsernamePasswordAuthenticationToken(newUser, null, newUser.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(newAuth);

                    log.info("✅ 디스코드 토큰 자동 갱신 성공: {}", userId);
                } catch (Exception e) {
                    log.warn("❌ 디스코드 토큰 갱신 실패: {}", userId);
                    SecurityContextHolder.clearContext();
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "디스코드 토큰 갱신 실패");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
