package com.crimecat.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Caffeine 기반 로컬 캐시 설정
 * - 각 캐시별 개별 TTL, 크기, 정책 설정
 * - CaffeineCacheType enum 기반 동적 캐시 생성
 * - 메모리 효율성과 성능 최적화
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Caffeine 기반 로컬 캐시 매니저
     * - 각 캐시 타입별 개별 설정 적용
     * - SimpleCacheManager + CaffeineCache 조합 사용
     */
    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();

        // CaffeineCacheType enum 기반으로 개별 캐시 생성
        List<CaffeineCache> caches = Arrays.stream(CaffeineCacheType.values())
            .map(cacheType -> new CaffeineCache(
                cacheType.getCacheName(),
                Caffeine.newBuilder()
                    .maximumSize(cacheType.getMaximumSize())           // 개별 최대 크기
                    .expireAfterWrite(cacheType.getDuration(), cacheType.getTimeUnit()) // 개별 TTL
                    .expireAfterAccess(Duration.ofMinutes(5))          // 공통 접근 만료 (5분)
                    .recordStats()                                     // 통계 수집 활성화
                    .build()
            ))
            .collect(Collectors.toList());

        cacheManager.setCaches(caches);
        return cacheManager;
    }
}