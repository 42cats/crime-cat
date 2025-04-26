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
import com.crimecat.backend.web.webUser.domain.WebUser;
import com.crimecat.backend.web.webUser.repository.WebUserRepository;

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
     *
     * @param request        HTTP 요청
     * @param response       HTTP 응답
     * @param authentication Spring Security 인증 정보
     */
@Override
public void onAuthenticationSuccess(HttpServletRequest request,
                                     HttpServletResponse response,
                                     Authentication authentication) throws IOException, ServletException {

    OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
    log.info("🧾 [OAuth2User 정보] {}", oAuth2User);

    String webUserId = Objects.requireNonNull(oAuth2User.getName());
    log.info("🆔 [WebUser UUID] {}", webUserId);

    Optional<WebUser> optionalUser = webUserRepository.findById(UUID.fromString(webUserId));

    if (optionalUser.isEmpty()) {
        log.error("❌ [OAuth2 인증 성공했지만 WebUser 없음]");
        response.sendRedirect(serviceUrlConfig.getDomain() + "/login?error=user_not_found");
        return;
    }

    WebUser user = optionalUser.get();

    String accessToken = jwtTokenProvider.createAccessToken(user.getId().toString(), user.getNickname(), user.getDiscordUserSnowflake());
    String refreshToken = jwtTokenProvider.createRefreshToken(user.getId().toString());

    log.info("✅ [AccessToken 생성 완료]");
    log.info("✅ [RefreshToken 생성 완료]");

    refreshTokenService.saveRefreshToken(user.getId().toString(), refreshToken);
    log.info("💾 [RefreshToken 저장 완료]");

    response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(accessToken));
    response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createRefreshCookie(refreshToken));

    String baseUrl = serviceUrlConfig.getDomain();
    log.info("🔁 [리다이렉트 수행 → {}]", baseUrl);
    response.sendRedirect(baseUrl);
}

}

