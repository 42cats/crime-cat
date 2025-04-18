package com.crimecat.backend.auth.handler;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.auth.util.TokenCookieUtil;
import com.crimecat.backend.config.ServiceUrlConfig;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 로그인 성공 핸들러
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    private final RefreshTokenService refreshTokenService;
    private final ServiceUrlConfig serviceUrlConfig;
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
        String webUserId = Objects.requireNonNull(oAuth2User.getName());
        System.out.println("userId = " + webUserId);
        Optional<WebUser> webUserByDiscordUserId = webUserRepository.findById(UUID.fromString(webUserId));
        webUserByDiscordUserId.ifPresent(v->{
            String accessToken = jwtTokenProvider.createAccessToken(v.getId().toString(), v.getNickname(),v.getDiscordUserSnowflake());
            String refreshToken = jwtTokenProvider.createRefreshToken(v.getId().toString());
            log.info("✅ [토큰 발급 완료]");
            refreshTokenService.saveRefreshToken(v.getId().toString(), refreshToken);
            log.info("💾 [RefreshToken 저장 완료]");

            response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(accessToken));
            response.addHeader(HttpHeaders.SET_COOKIE,TokenCookieUtil.createRefreshCookie(refreshToken));
            try {
                String baseUrl = serviceUrlConfig.getDomain();
                response.sendRedirect(baseUrl);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }

        });
    }
}
