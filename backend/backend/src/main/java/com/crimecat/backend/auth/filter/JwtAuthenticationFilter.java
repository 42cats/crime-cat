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
        if (request.getRequestURI().startsWith("/bot/v1/")){
            filterChain.doFilter(request, response);
            return;
        }
        if (request.getRequestURI().startsWith("/login/oauth2/")) {
            filterChain.doFilter(request, response);
            return;
        } // successHandeler 로 가는거 막는 부분
        log.info("request = {}", request);
        String token = TokenCookieUtil.getCookieValue(request, "Authorization");
        if (token == null) {
            // 🚨 토큰 없으면 바로 인증 실패 응답
            unauthorized(response, "Missing Token");
            return;
        }

        if (!jwtTokenProvider.validateToken(token)) {
            // 🚨 토큰 유효성 검사 실패
            unauthorized(response, "Invalid Token");
            return;
        }

        if (jwtBlacklistService.isBlacklisted(token)) {
            // 🚨 블랙리스트 된 토큰
            unauthorized(response, "Token Blacklisted");
            return;
        }

        if (token == null) {
            String bearer = request.getHeader("Authorization");
            if (bearer != null && bearer.startsWith("Bearer ")) {
                token = bearer.substring(7); // "Bearer " 이후 토큰만 가져오기
            }
        }
        
        // 쿠키에서 AccessToken (Authorization) 추출
        String token = TokenCookieUtil.getCookieValue(request, "Authorization");
        System.out.println("token = " + token);
        // 토큰 검증 & 블랙리스트 검사
        if (token != null && jwtTokenProvider.validateToken(token) && !jwtBlacklistService.isBlacklisted(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);
            log.info("✅ Extracted userId: {}", userId);
            Optional<WebUser> user = webUserRepository.findById(UUID.fromString(userId));
                    if(user.isEmpty()){
                        log.warn("유저 디비에 없음, 인증패스");
                        SecurityContextHolder.clearContext();

                        // 🧹 쿠키까지 삭제
                        TokenCookieUtil.clearAuthCookies(response);
                        filterChain.doFilter(request,response);
                        return;
                    }
            WebUser webUser = user.get();
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            new DiscordOAuth2User(webUser,null,null),
                            null,
                            webUser.getAuthorities()
                    );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

}
