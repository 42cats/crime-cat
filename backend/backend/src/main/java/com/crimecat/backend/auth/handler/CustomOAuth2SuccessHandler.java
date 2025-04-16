package com.crimecat.backend.auth.handler;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * OAuth2 로그인 성공 핸들러
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    /**
     * 인증 성공 시 후속 처리를 담당
     * @param request       HTTP 요청
     * @param response      HTTP 응답
     * @param authentication Spring Security 인증 정보
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        System.out.println("oAuth2User = " + oAuth2User);
        String userId = Objects.requireNonNull(oAuth2User.getAttribute("id")).toString();
        System.out.println("userId = " + userId);
        Optional<WebUser> webUserByDiscordUserId = webUserRepository.findWebUserByDiscordUserId(userId);
        webUserByDiscordUserId.ifPresent(v->{
            String accessToken = jwtTokenProvider.createAccessToken(v.getId(), v.getNickname());
            int cookieDay = 7;
            Cookie cookie = new Cookie("Authorization", accessToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(true);
            cookie.setPath("/");
            cookie.setMaxAge(cookieDay * 24 * 60 * 60);
            response.addCookie(cookie);
//            response.sendRedirect();

        });

        // 이 부분에서 인증된 사용자 정보 등을 활용할 수 있음
        // 예) authentication.getPrincipal() 로 OAuth2User 등의 객체 확인 가능

        System.out.println("success~~~~~~~~~~~~~~~~~");
        // 예: 인증 성공 후 특정 페이지로 리다이렉트
        response.sendRedirect("/");
    }
}
