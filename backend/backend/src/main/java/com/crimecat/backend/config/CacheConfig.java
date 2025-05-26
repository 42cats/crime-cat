package com.crimecat.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * 캐시 설정 클래스
 * Redis를 사용한 캐싱 구성
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // 기본 TTL 10분
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // 캐시별 개별 설정
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 게임 테마 캐시 (1시간)
        cacheConfigurations.put("game:theme", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("game:theme:list", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("game:theme:like", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // 게시판 캐시 (10분)
        cacheConfigurations.put("board:post:list", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("board:post", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // 사용자 프로필 캐시 (30분)
        cacheConfigurations.put("user:profile", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("user:profile:detail", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // 검색 결과 캐시 (5분)
        cacheConfigurations.put("search:users", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("search:posts", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("search:themes", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // 통계 캐시 (1시간)
        cacheConfigurations.put("stats:main", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("stats:game", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // 공지사항 캐시 (1시간)
        cacheConfigurations.put("notice:list", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("notice", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // 명령어 캐시 (2시간)
        cacheConfigurations.put("command:list", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put("command", defaultConfig.entryTtl(Duration.ofHours(2)));
        
        // 해시태그 캐시 (30분)
        cacheConfigurations.put("hashtag:popular", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}