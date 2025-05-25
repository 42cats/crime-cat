package com.crimecat.backend.config;

import com.crimecat.backend.utils.RedisDbType;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.support.CompositeCacheManager;
import org.springframework.cache.support.SimpleCacheManager;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine (로컬) + Redis (분산) 하이브리드 캐시 설정
 * 
 * 전략:
 * - 자주 접근되는 작은 데이터: Caffeine (빠른 응답)
 * - 분산 환경에서 공유해야 하는 데이터: Redis
 * - 중요한 데이터: Redis (영속성)
 */
@Configuration
@EnableCaching
@org.springframework.context.annotation.Profile("optimization")  // Only active when optimization profile is active
// @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
//     name = "spring.cache.type",
//     havingValue = "hybrid", 
//     matchIfMissing = false
// )  // 일단 비활성화하여 기본 동작하도록 함
public class HybridCacheConfig {

    /**
     * Caffeine 캐시 매니저 - 로컬 캐시용
     * 짧은 TTL, 자주 접근되는 데이터
     */
    @Bean("caffeineCacheManager")
    public CaffeineCacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // 캐시 이름들을 미리 설정
        cacheManager.setCacheNames(java.util.Arrays.asList(
            CacheType.VIEW_COUNT,
            "board:post:list",
            "comment:list",
            "comment:public",
            "notification:unread",
            "search:users"
        ));
        
        // 기본 Caffeine 설정
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000)
                .recordStats());
        
        return cacheManager;
    }
    
    /**
     * 캐시별 개별 설정을 위한 커스텀 캐시 매니저
     */
    @Bean("customCaffeineCacheManager") 
    public CacheManager customCaffeineCacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        
        List<CaffeineCache> caches = new ArrayList<>();
        
        // VIEW_COUNT - 짧은 TTL
        caches.add(buildCache(CacheType.VIEW_COUNT, 
            Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.MINUTES)
                .maximumSize(10000)));
        
        // 게시판/댓글 목록 - 2분 캐시
        caches.add(buildCache("board:post:list",
            Caffeine.newBuilder()
                .expireAfterWrite(2, TimeUnit.MINUTES)
                .maximumSize(500)));
        
        caches.add(buildCache("comment:list",
            Caffeine.newBuilder()
                .expireAfterWrite(2, TimeUnit.MINUTES)
                .maximumSize(1000)));
        
        // 알림 카운트 - 30초 캐시
        caches.add(buildCache("notification:unread",
            Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS)
                .maximumSize(10000)));
        
        cacheManager.setCaches(caches);
        return cacheManager;
    }
    
    private CaffeineCache buildCache(String name, Caffeine<Object, Object> caffeine) {
        return new CaffeineCache(name, caffeine.build());
    }

    /**
     * Redis 캐시 매니저 - 분산 캐시용
     * 긴 TTL, 공유가 필요한 데이터
     */
    @Bean("optimizedRedisCacheManager")
    public RedisCacheManager optimizedRedisCacheManager(
            RedisConnectionFactory redisConnectionFactory,
            @Qualifier("redisObjectMapper") com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        
        // 기본 Redis 캐시 설정
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer(objectMapper)));
        
        // 캐시별 개별 설정
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 사용자 권한 - 15분
        cacheConfigurations.put("user:permissions", defaultConfig
                .entryTtl(RedisDbType.USER_PERMISSIONS.getTtl()));
        
        // 사용자 랭킹 - 5분
        cacheConfigurations.put("user:ranking", defaultConfig
                .entryTtl(RedisDbType.USER_RANKING.getTtl()));
        
        // 사용자 프로필 - 10분
        cacheConfigurations.put("user:profile", defaultConfig
                .entryTtl(RedisDbType.USER_PROFILE.getTtl()));
        
        // 게임 테마 상세 - 30분
        cacheConfigurations.put("game:theme", defaultConfig
                .entryTtl(RedisDbType.GAME_THEME_DETAIL.getTtl()));
        
        // 게임 테마 목록 - 5분
        cacheConfigurations.put("game:theme:list", defaultConfig
                .entryTtl(RedisDbType.GAME_THEME_LIST.getTtl()));
        
        // 권한 목록 - 1시간
        cacheConfigurations.put("permission:all", defaultConfig
                .entryTtl(RedisDbType.PERMISSION_LIST.getTtl()));
        
        // 통합 게임 기록 - 10분
        cacheConfigurations.put(CacheType.INTEGRATED_HISTORIES, defaultConfig
                .entryTtl(Duration.ofMinutes(10)));
        
        // 위치 매핑 - 30분
        cacheConfigurations.put(CacheType.LOCATION_MAPPING, defaultConfig
                .entryTtl(Duration.ofMinutes(30)));
        
        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    /**
     * 복합 캐시 매니저 - Caffeine과 Redis를 함께 사용
     * 먼저 Caffeine에서 찾고, 없으면 Redis에서 찾음
     */
    @Bean
    @Primary
    public CacheManager cacheManager(
            @Qualifier("caffeineCacheManager") CaffeineCacheManager caffeineCacheManager,
            @Qualifier("optimizedRedisCacheManager") RedisCacheManager redisCacheManager) {
        
        CompositeCacheManager compositeCacheManager = new CompositeCacheManager();
        // 순서 중요: Caffeine 먼저, Redis 나중
        compositeCacheManager.setCacheManagers(java.util.Arrays.asList(caffeineCacheManager, redisCacheManager));
        compositeCacheManager.setFallbackToNoOpCache(false);
        
        return compositeCacheManager;
    }
}