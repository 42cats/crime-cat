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
@Component("signupSuccessHandler")
public class SignupSuccessHandler extends BaseOAuth2SuccessHandler {
    
    // 생성자 (의존성 주입)
    public SignupSuccessHandler(JwtTokenProvider jwtTokenProvider,
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
        // 기존 사용자인지 확인 (createdAt과 lastLoginAt이 다르면 기존 사용자로 간주)
        if (webUser.getCreatedAt() != null && 
            !webUser.getCreatedAt().equals(webUser.getLastLoginAt())) {
            log.info("🔄 이미 가입된 사용자 ({}). 자동 로그인을 진행합니다.", webUser.getNickname());
            // 기존 계정이지만 성공적으로 처리
        }
        
        log.info("✅ [회원가입/로그인 성공] 사용자: {}", webUser.getNickname());
        return true;
    }
}
