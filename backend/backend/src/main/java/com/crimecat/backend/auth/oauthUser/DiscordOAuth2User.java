package com.crimecat.backend.auth.oauthUser;

import lombok.Data;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;

@Data
public class DiscordOAuth2User implements OAuth2User {
    private final OAuth2User delegate;
    private final String accessToken;
    private final String refreshToken;
    private final Instant expiresAt;

    public DiscordOAuth2User(OAuth2User delegate, String accessToken, String refreshToken, Instant expiresAt) {
        this.delegate = delegate;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresAt = expiresAt;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        return delegate.getName();
    }
}
