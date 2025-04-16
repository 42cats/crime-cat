package com.crimecat.backend.auth.service;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.auth.domain.UserToken;
import com.crimecat.backend.auth.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebUserRepository webUserRepository;
    private final UserTokenRepository userTokenRepository;

    public TokenResponse generateTokens(WebUser user) {
        // AccessToken 생성
        String accessToken = jwtTokenProvider.createAccessToken(user.getId().toString(), user.getNickname());

        // RefreshToken 생성
        String refreshToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(60 * 60 * 24 * 14); // 14일

        // 저장
        UserToken userToken = UserToken.builder()
                .id(UUID.randomUUID())
                .webUser(user)
                .provider("discord")
                .refreshToken(refreshToken)
                .jti(UUID.randomUUID().toString())
                .expiresAt(Date.from(expiresAt))
                .build();

        userTokenRepository.save(userToken);

        return new TokenResponse(accessToken, refreshToken);
    }

    public record TokenResponse(String accessToken, String refreshToken) {}
}
