package com.crimecat.backend.auth.filter;

import java.io.IOException;
import java.util.UUID;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;

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
        if (request.getRequestURI().startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        } // successHandeler 로 가는거 막는 부분
        log.info("request = {}", request);
        // 쿠키에서 AccessToken (Authorization) 추출
        String token = TokenCookieUtil.getCookieValue(request, "Authorization");
        System.out.println("token = " + token);
        // 토큰 검증 & 블랙리스트 검사
        if (token != null && jwtTokenProvider.validateToken(token) && !jwtBlacklistService.isBlacklisted(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);
            log.info("✅ Extracted userId: {}", userId);
            WebUser user = webUserRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            new DiscordOAuth2User(user,null,null,null,null,null),
                            null,
                            user.getAuthorities()
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
