package com.crimecat.backend.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Redis 캐시를 위한 통합 서비스
 * JSON 직렬화/역직렬화를 지원하며 타입별 TTL 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 객체를 Redis에 저장 (RedisDbType의 TTL 사용)
     */
    public <T> void save(RedisDbType type, String key, T value) {
        try {
            String jsonValue = objectMapper.writeValueAsString(value);
            String fullKey = buildKey(type, key);
            redisTemplate.opsForValue().set(fullKey, jsonValue, type.getTtl());
            log.debug("Saved to Redis - key: {}, ttl: {}", fullKey, type.getTtl());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize object for Redis - type: {}, key: {}", type, key, e);
        }
    }

    /**
     * 객체를 Redis에 저장 (커스텀 TTL 사용)
     */
    public <T> void save(String key, T value, Duration ttl) {
        try {
            String jsonValue = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, jsonValue, ttl);
            log.debug("Saved to Redis - key: {}, ttl: {}", key, ttl);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize object for Redis - key: {}", key, e);
        }
    }

    /**
     * Redis에서 객체 조회
     */
    public <T> Optional<T> load(RedisDbType type, String key, Class<T> clazz) {
        try {
            String fullKey = buildKey(type, key);
            String jsonValue = redisTemplate.opsForValue().get(fullKey);
            
            if (jsonValue == null) {
                log.debug("Cache miss - key: {}", fullKey);
                return Optional.empty();
            }
            
            T value = objectMapper.readValue(jsonValue, clazz);
            log.debug("Cache hit - key: {}", fullKey);
            return Optional.of(value);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize object from Redis - type: {}, key: {}", type, key, e);
            return Optional.empty();
        }
    }

    /**
     * Redis에서 객체 조회 (키만 사용)
     */
    public <T> Optional<T> load(String key, Class<T> clazz) {
        try {
            String jsonValue = redisTemplate.opsForValue().get(key);
            
            if (jsonValue == null) {
                log.debug("Cache miss - key: {}", key);
                return Optional.empty();
            }
            
            T value = objectMapper.readValue(jsonValue, clazz);
            log.debug("Cache hit - key: {}", key);
            return Optional.of(value);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize object from Redis - key: {}", key, e);
            return Optional.empty();
        }
    }

    /**
     * 캐시 삭제
     */
    public void delete(RedisDbType type, String key) {
        String fullKey = buildKey(type, key);
        Boolean deleted = redisTemplate.delete(fullKey);
        log.debug("Deleted from Redis - key: {}, success: {}", fullKey, deleted);
    }

    /**
     * 캐시 삭제 (키만 사용)
     */
    public void delete(String key) {
        Boolean deleted = redisTemplate.delete(key);
        log.debug("Deleted from Redis - key: {}, success: {}", key, deleted);
    }

    /**
     * 패턴으로 캐시 삭제
     */
    public void deletePattern(String pattern) {
        var keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            Long deletedCount = redisTemplate.delete(keys);
            log.debug("Deleted from Redis by pattern - pattern: {}, count: {}", pattern, deletedCount);
        }
    }

    /**
     * 캐시 존재 여부 확인
     */
    public boolean exists(RedisDbType type, String key) {
        String fullKey = buildKey(type, key);
        Boolean exists = redisTemplate.hasKey(fullKey);
        return Boolean.TRUE.equals(exists);
    }

    /**
     * TTL 갱신
     */
    public void refreshTtl(RedisDbType type, String key) {
        String fullKey = buildKey(type, key);
        redisTemplate.expire(fullKey, type.getTtl().toMillis(), TimeUnit.MILLISECONDS);
    }

    /**
     * 남은 TTL 조회 (초 단위)
     */
    public Long getTimeToLive(RedisDbType type, String key) {
        String fullKey = buildKey(type, key);
        return redisTemplate.getExpire(fullKey, TimeUnit.SECONDS);
    }

    /**
     * 전체 키 생성
     */
    private String buildKey(RedisDbType type, String key) {
        return String.format("%s:%s", type.toString(), key);
    }

    /**
     * 문자열 값 저장 (기존 호환성)
     */
    public void saveString(RedisDbType type, String value) {
        redisTemplate.opsForValue().set(type.toString(), value, type.getTtl());
    }

    /**
     * 문자열 값 조회 (기존 호환성)
     */
    public Optional<String> loadString(RedisDbType type) {
        String value = redisTemplate.opsForValue().get(type.toString());
        return Optional.ofNullable(value);
    }
}