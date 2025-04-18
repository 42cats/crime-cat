package com.crimecat.backend.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.service.WebUserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final WebUserService webUserService;
    private final DiscordRedisTokenService discordRedisTokenService;
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = new DefaultOAuth2UserService().loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId();
        OAuth2AccessToken discordAccessToken = request.getAccessToken();
        Map<String, Object> attributes = oauth2User.getAttributes();
        String discordId = (String) attributes.get("id");
        String email = (String) attributes.get("email");
        String username = (String) attributes.get("global_name");
        if (username == null || username.isBlank()) {
            username = (String) attributes.get("username"); // fallback
        }

        // 유저 저장 또는 업데이트
        WebUser webUser = webUserService.processOAuthUser(discordId, email, username ,provider);// 리턴
        Instant expiresAt = discordAccessToken.getExpiresAt();
        long expiresInSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        discordRedisTokenService.saveAccessToken(
                webUser.getId().toString(),
                discordAccessToken.getTokenValue(),
                expiresInSeconds
        );

        log.debug("여기까진 잘오나?={} ",webUser.toString());
        return new DiscordOAuth2User(
                webUser,
                attributes,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + webUser.getRole())));
    }
}
