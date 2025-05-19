package com.crimecat.backend.auth.service;

import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.stereotype.Service;

@Slf4j
@Service("discordLoginService")
public class DiscordLoginService extends BaseDiscordOAuth2UserService {
    
    // 생성자 (의존성 주입)
    public DiscordLoginService(WebUserService webUserService, 
                              UserRepository userRepository,
                              WebUserRepository webUserRepository,
                              DiscordUserRepository discordUserRepository,
                              PermissionService permissionService,
                              UserPermissionService userPermissionService) {
        super(webUserService, userRepository, webUserRepository, discordUserRepository, 
              permissionService, userPermissionService);
    }
    
    @Override
    protected WebUser processUser(String discordId, String email, String username, String provider) {
        // 사용자가 존재하는지 확인
        Optional<WebUser> existingUser = webUserRepository.findByDiscordUserSnowflake(discordId);
        if (existingUser.isEmpty()) {
            log.error("❌ 사용자를 찾을 수 없습니다. 회원가입이 필요합니다.");
            throw new OAuth2AuthenticationException(new OAuth2Error("account_not_found"), 
                "해당 Discord 계정으로 가입된 사용자가 없습니다.");
        }
        
        // 로그인 처리 (마지막 로그인 시간 업데이트)
        WebUser webUser = existingUser.get();
        webUser.setLastLoginAt(LocalDateTime.now());
        return webUserRepository.save(webUser);
    }
}
