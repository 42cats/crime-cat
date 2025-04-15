package com.crimecat.backend.auth.filter;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.JwtBlacklistService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    private final JwtBlacklistService jwtBlacklistService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 쿠키에서 JWT(Authorization) 추출
        String token = TokenCookieUtil.getCookieValue(request, "Authorization");

        // 2. 토큰 유효성 검사
        if (token != null && jwtTokenProvider.validateToken(token) && ! jwtBlacklistService.isBlacklisted(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);

            WebUser user = webUserRepository.findWebUserByDiscordUserId(userId)
                    .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

            // 3. 인증 객체 생성 (Spring Security에 사용자 정보 설정)
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, user.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 4. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }
}
