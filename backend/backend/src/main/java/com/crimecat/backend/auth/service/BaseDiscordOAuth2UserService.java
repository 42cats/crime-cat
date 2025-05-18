package com.crimecat.backend.auth.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.repository.DiscordUserRepository;
import com.crimecat.backend.user.service.UserPermissionService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.webUser.service.WebUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collections;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseDiscordOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    
    // 공통 의존성 주입
    protected final WebUserService webUserService;
    protected final UserRepository userRepository;
    protected final WebUserRepository webUserRepository;
    protected final DiscordUserRepository discordUserRepository;
    protected final PermissionService permissionService;
    protected final UserPermissionService userPermissionService;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        // 1. Discord API에서 사용자 정보 로드
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(request);
        
        // 2. 필요한 속성 추출
        String provider = request.getClientRegistration().getRegistrationId()
            .replace("-login", "").replace("-signup", "");
        Map<String, Object> attributes = oauth2User.getAttributes();
        String discordId = (String) attributes.get("id");
        String email = (String) attributes.get("email");
        String username = (String) attributes.get("global_name");
        if (username == null || username.isBlank()) {
            username = (String) attributes.get("username");
        }
        
        // 3. 구현체에서 오버라이드한 메소드 호출 (로그인/회원가입 분기)
        WebUser webUser = processUser(discordId, email, username, provider);
        
        // 4. Spring Security 인증 객체 생성
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                webUser,
                null,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + webUser.getRole()))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        return webUser;
    }
    
    // 하위 클래스에서 구현할 추상 메소드
    protected abstract WebUser processUser(String discordId, String email, String username, String provider);
}
