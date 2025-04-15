package com.crimecat.backend.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class JwtBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    public void blacklistToken(String token, long expirationMillis) {
        redisTemplate.opsForValue().set(token, "blacklisted", expirationMillis, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String token) {
        return "blacklisted".equals(redisTemplate.opsForValue().get(token));
    }
}
