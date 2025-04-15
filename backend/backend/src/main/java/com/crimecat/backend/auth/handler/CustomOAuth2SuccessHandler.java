package com.crimecat.backend.auth.handler;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.webUser.LoginMethod;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;

import static com.crimecat.backend.auth.util.TokenCookieUtil.*;

/**
 * OAuth2 로그인 성공 핸들러
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserService webUserService;
    private final RefreshTokenService refreshTokenService;
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
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId();
        String discordUserId = Objects.requireNonNull(oAuth2User.getAttribute("id")).toString();
        String email = oAuth2User.getAttribute("email");
        String nickname = oAuth2User.getAttribute("global_name");

        // 먼저 Discord ID로 조회

        WebUser user = webUserService.processOAuthUser(discordUserId, email, nickname);

        // 토큰 생성 및 저장
        String accessToken = jwtTokenProvider.createAccessToken(user.getDiscordUserId(), user.getNickname());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getDiscordUserId());

        refreshTokenService.saveRefreshToken(user.getDiscordUserId(), refreshToken);
        setAuthCookies(response, accessToken, refreshToken);

        log.info("✅ 로그인 성공 - userId: {}, nickname: {}", user.getDiscordUserId(), user.getNickname());

        // 원하는 페이지로 리다이렉트
        response.sendRedirect("/login/success"); // 클라이언트 쪽 처리에 맞춰 조정
    }

}
