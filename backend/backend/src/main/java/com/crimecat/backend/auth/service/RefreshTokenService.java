package com.crimecat.backend.auth.service;

import com.crimecat.backend.auth.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisTemplate<String, String> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private static final String PREFIX = "refresh:";

    // 저장
    public void saveRefreshToken(String userId, String refreshToken) {
        long expiration = jwtTokenProvider.getRefreshTokenValidity();
        redisTemplate.opsForValue().set(PREFIX + userId, refreshToken, Duration.ofMillis(expiration));
    }

    // 조회
    public String getRefreshToken(String userId) {
        return redisTemplate.opsForValue().get(PREFIX + userId);
    }

    // 삭제
    public void deleteRefreshToken(String userId) {
        redisTemplate.delete(PREFIX + userId);
    }
}
