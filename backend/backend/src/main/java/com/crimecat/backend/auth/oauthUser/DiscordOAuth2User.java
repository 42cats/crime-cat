package com.crimecat.backend.auth.oauthUser;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.crimecat.backend.webUser.domain.WebUser;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DiscordOAuth2User implements OAuth2User {

    private final WebUser webUser;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    private final String accessToken;
    private final String refreshToken;
    private final Instant expiresAt;

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return webUser.getId().toString(); // 또는 webUser.getDiscordId()
    }

    /**
     * attributes에 존재하는 키의 값을 문자열로 반환 (없으면 null)
     */
    public String getAttribute(String key) {
        Object value = attributes.get(key);
        return value != null ? value.toString() : null;
    }

    /**
     * attributes에 존재하는 키의 값을 타입 그대로 반환 (Generic)
     */
    @SuppressWarnings("unchecked")
    public <T> T getAttributeAs(String key) {
        return (T) attributes.get(key);
    }
}
