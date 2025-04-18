package com.crimecat.backend.auth.service;

import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordRedisTokenService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String DISCORD_ACCESS_PREFIX = "discord:access:";

    /**
     * Discord AccessToken 저장
     */
    public void saveAccessToken(String userId, String accessToken, long expiresInSeconds) {
        String key = DISCORD_ACCESS_PREFIX + userId;
        redisTemplate.opsForValue().set(key, accessToken, Duration.ofSeconds(expiresInSeconds));
        log.debug("✅ Discord AccessToken 저장됨: key={}, expiresIn={}초", key, expiresInSeconds);
    }

    /**
     * AccessToken 조회
     */
    public String getAccessToken(String userId) {
        return redisTemplate.opsForValue().get(DISCORD_ACCESS_PREFIX + userId);
    }

    /**
     * AccessToken 삭제
     */
    public void deleteAccessToken(String userId) {
        redisTemplate.delete(DISCORD_ACCESS_PREFIX + userId);
    }

}
