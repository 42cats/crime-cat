package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import com.crimecat.backend.auth.service.DiscordTokenService;
import com.crimecat.backend.auth.dto.DiscordTokenResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;


@Slf4j
@RequiredArgsConstructor
public class OAuth2TokenRefreshFilter extends OncePerRequestFilter {

    private final DiscordTokenService discordTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
        throws ServletException, IOException{
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication != null && authentication.isAuthenticated()
            && authentication.getPrincipal() instanceof DiscordOAuth2User){
            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            Instant expiresAt = user.getExpiresAt();

            if(expiresAt != null && isTokenExpiringSoon(expiresAt)){
                String userId = user.getName() != null ? user.getName() : String.valueOf(user.getAttributes().get("id"));
                log.info("🔁 Access Token 갱신 시작 (사용자 ID: {})", userId);
                try{
                DiscordTokenResponse discordTokenResponse = discordTokenService.refreshAccessToken(user.getRefreshToken());
                String accessToken = discordTokenResponse.getAccessToken();
                String refreshToken = discordTokenResponse.getRefreshToken();
                Instant expireDate = Instant.now().plusSeconds(discordTokenResponse.getExpiresIn());
                DiscordOAuth2User newUser = new DiscordOAuth2User(user,
                        accessToken,
                        refreshToken,
                        expireDate);
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(newUser, null, newUser.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication((usernamePasswordAuthenticationToken));
                log.info("디스코드 토큰 갱신 성공");
                } catch (Exception e) {
                    log.warn("디스코드 토큰 생성 실패");
                    SecurityContextHolder.clearContext();
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "디스코드 토큰 갱신 실패");
                    return;
                }
            }
        }
        filterChain.doFilter(request,response);
    }
    private boolean isTokenExpiringSoon(Instant expiresAt) {
        return Duration.between(Instant.now(), expiresAt).toMinutes() <= 5;
    }
}
