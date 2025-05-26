package com.crimecat.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    // application.yml 또는 Compose environment 에 설정된 값 주입
    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // Docker 네트워크 상의 'redis:6379' 로 연결
        return new LettuceConnectionFactory(redisHost, redisPort);
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory());
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        return template;
    }

    @Bean
    public RedisCacheManager redisCacheManager(RedisConnectionFactory redisConnectionFactory,
                                               @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
        // 기본 캐시 설정 (1시간 TTL)
        RedisCacheConfiguration defaultCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(java.time.Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer(redisObjectMapper)));

        // 캐시별 개별 설정
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 통합 게임 기록은 10분 TTL
        cacheConfigurations.put(CacheType.INTEGRATED_HISTORIES, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofMinutes(10)));
        
        // 사용자 통계는 30분 TTL
        cacheConfigurations.put(CacheType.USER_STATISTICS, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofMinutes(30)));
        
        // 테마 정보는 1시간 TTL
        cacheConfigurations.put(CacheType.GAME_THEME, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofHours(1)));
        
        // 게시판은 5분 TTL
        cacheConfigurations.put(CacheType.BOARD_POST_LIST, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofMinutes(5)));
        
        // 사용자 프로필은 30분 TTL
        cacheConfigurations.put(CacheType.USER_PROFILE, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofMinutes(30)));
        
        // 검색 결과는 10분 TTL
        cacheConfigurations.put(CacheType.SEARCH_USERS, 
            defaultCacheConfig.entryTtl(java.time.Duration.ofMinutes(10)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
