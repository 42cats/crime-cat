package com.crimecat.backend.auth.handler;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.config.ServiceUrlConfig;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.ProfileChecker;
import com.crimecat.backend.utils.TokenCookieUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseOAuth2SuccessHandler implements AuthenticationSuccessHandler {
    
    // 공통 의존성 주입
    protected final JwtTokenProvider jwtTokenProvider;
    protected final WebUserRepository webUserRepository;
    protected final RefreshTokenService refreshTokenService;
    protected final ServiceUrlConfig serviceUrlConfig;
    protected final ProfileChecker profileChecker;
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                       HttpServletResponse response,
                                       Authentication authentication) throws IOException, ServletException {
        
        // 1. WebUser 객체 추출
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        String webUserId = webUser.getId().toString();
        
        // 2. 하위 클래스에서 구현한 메소드 호출 (로그인/회원가입 검증)
        boolean proceed = handleAuthenticationSuccess(webUser, request, response);
        
        // 3. 검증 실패 또는 이미 리다이렉트된 경우 중단
        if (!proceed) {
            return;
        }
        
        // 4. 사용자 조회
        Optional<WebUser> optionalUser = webUserRepository.findById(UUID.fromString(webUserId));
        
        if (optionalUser.isEmpty()) {
            log.error("❌ [OAuth2 인증 성공했지만 WebUser 없음]");
            throw ErrorStatus.USER_NOT_FOUND.asException();
        }
        
        WebUser user = optionalUser.get();
        
        // 5. JWT 토큰 발급 및 쿠키 설정
        String accessToken = jwtTokenProvider.createAccessToken(user.getId().toString(), 
            user.getNickname(), user.getDiscordUserSnowflake());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId().toString());
        
        refreshTokenService.saveRefreshToken(user.getId().toString(), refreshToken);
        
        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createAccessCookie(accessToken));
        response.addHeader(HttpHeaders.SET_COOKIE, TokenCookieUtil.createRefreshCookie(refreshToken));
        
        // 6. 리다이렉트
        String baseUrl = serviceUrlConfig.getDomain();
        response.sendRedirect("https://" + baseUrl + "/");
    }
    
    // 하위 클래스에서 구현할 추상 메소드
    protected abstract boolean handleAuthenticationSuccess(
        WebUser webUser, HttpServletRequest request, HttpServletResponse response) throws IOException;
}
