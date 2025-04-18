package com.crimecat.backend.auth.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.service.WebUserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final WebUserService webUserService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        System.out.println("=============================DiscordOAuth2UserService.loadUser");
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId();
        System.out.println("oauth2User: " + oauth2User + " provider " + provider);
        // Discord 사용자 정보 가져오기
        Map<String, Object> attributes = oauth2User.getAttributes();
        System.out.println("attributes = " + attributes);
        String discordId = (String) attributes.get("id");
        String email = (String) attributes.get("email");
        String username = (String) attributes.get("global_name");
        if (username == null || username.isBlank()) {
            username = (String) attributes.get("username"); // fallback
        }

        // 유저 저장 또는 업데이트
        WebUser webUser = webUserService.processOAuthUser(discordId, email, username ,provider);// 리턴
        Map<String,Object> newAttributes = new HashMap<>();
        newAttributes.put("discordSnowFlake", discordId);
        newAttributes.put("email", email);
        newAttributes.put("username", username);
        newAttributes.put("userId", webUser.getId().toString());
        log.debug("여기까진 잘오나?={} new attribute={}",webUser.toString(), newAttributes.toString());
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + webUser.getRole())),
                newAttributes,
                "userId" // WebUser UUID
        );
    }
}
