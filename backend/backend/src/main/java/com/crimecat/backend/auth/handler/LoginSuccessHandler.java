package com.crimecat.backend.auth.handler;

import com.crimecat.backend.auth.controller.AuthController;
import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.auth.service.RefreshTokenService;
import com.crimecat.backend.config.ServiceUrlConfig;
import com.crimecat.backend.utils.ProfileChecker;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component("loginSuccessHandler")
public class LoginSuccessHandler extends BaseOAuth2SuccessHandler {
    
    // 생성자 (의존성 주입)
    public LoginSuccessHandler(JwtTokenProvider jwtTokenProvider,
                              WebUserRepository webUserRepository,
                              RefreshTokenService refreshTokenService,
                              ServiceUrlConfig serviceUrlConfig,
                              ProfileChecker profileChecker) {
        super(jwtTokenProvider, webUserRepository, refreshTokenService, serviceUrlConfig, profileChecker);
    }
    
    @Override
    protected boolean handleAuthenticationSuccess(WebUser webUser, 
                                                 HttpServletRequest request, 
                                                 HttpServletResponse response) throws IOException {
        // 새로 가입한 사용자인지 확인 (createdAt과 lastLoginAt이 같으면 신규 사용자로 간주)
        if (webUser.getCreatedAt() != null && 
            webUser.getCreatedAt().equals(webUser.getLastLoginAt())) {
            log.error("신규 사용자가 로그인을 시도했습니다. 회원가입이 필요합니다.");
            AuthController.setOAuthError("not_registered", "해당 Discord 계정으로 가입된 사용자가 없습니다. 회원가입을 진행해주세요.");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        
        log.info("🔐 [로그인 성공] 사용자: {}", webUser.getNickname());
        return true;
    }
}
