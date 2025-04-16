package com.crimecat.backend.auth.service;

<<<<<<< Updated upstream
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.service.WebUserService;
=======
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.webUser.LoginMethod;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
>>>>>>> Stashed changes
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
<<<<<<< Updated upstream
=======
import java.util.Optional;
>>>>>>> Stashed changes

@Service
@RequiredArgsConstructor
public class DiscordOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

<<<<<<< Updated upstream
    private final WebUserService webUserService;
=======
    private final WebUserRepository webUserRepository;
    private final UserRepository discordUserRepository;


//    public DiscordOAuth2UserService(WebUserRepository userRepository, UserRepository discordUserRepository) {
//        this.webUserRepository = userRepository;
//        this.discordUserRepository = discordUserRepository;
//    }

>>>>>>> Stashed changes

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(request);
<<<<<<< Updated upstream
        String provider = request.getClientRegistration().getRegistrationId();
=======

>>>>>>> Stashed changes
        // Discord 사용자 정보 가져오기
        Map<String, Object> attributes = oauth2User.getAttributes();
        System.out.println("attributes = " + attributes);
        String discordId = (String) attributes.get("id");
        String email = (String) attributes.get("email");
        String username = (String) attributes.get("global_name");

        // 유저 저장 또는 업데이트
<<<<<<< Updated upstream
        WebUser webUser = webUserService.processOAuthUser(discordId, email, username,provider);// 리턴 (Spring Security가 자동 로그인 처리)
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + webUser.getRole())),
=======
        WebUser user = webUserRepository.findWebUserByDiscordUserId(discordId)
                .orElseGet(() -> {
                    WebUser newUser = new WebUser();
                    Optional<User> discordUser = discordUserRepository.findBySnowflake(discordId);
                    discordUser.ifPresent(v-> newUser.setDiscordUserId(v.getSnowflake()));
                    newUser.setEmail(email);
                    newUser.setNickname(username);
                    newUser.setLoginMethod(LoginMethod.OAUTH);
                    return webUserRepository.save(newUser);
                });

        // 리턴 (Spring Security가 자동 로그인 처리)
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
>>>>>>> Stashed changes
                attributes,
                "id" // 유저의 고유 속성 (username 같은)
        );
    }
}
