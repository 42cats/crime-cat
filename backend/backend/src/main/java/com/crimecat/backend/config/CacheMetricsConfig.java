package com.crimecat.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.metrics.cache.CacheMetricsRegistrar;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCache;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.annotation.PostConstruct;
import java.util.concurrent.TimeUnit;

/**
 * 캐시 메트릭스 설정
 * - Caffeine과 Redis 캐시의 히트율, 미스율, 적재율 등을 모니터링
 * - Micrometer를 통해 메트릭스 수집
 */
@Slf4j
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class CacheMetricsConfig {

    private final CacheManager cacheManager;
    private final MeterRegistry meterRegistry;
    private final RedisTemplate<String, String> redisTemplate;

    @PostConstruct
    public void registerCacheMetrics() {
        log.info("캐시 메트릭스 등록 시작");
        
        // Caffeine 캐시 메트릭스 등록
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache instanceof CaffeineCache) {
                registerCaffeineMetrics(cacheName, ((CaffeineCache) cache).getNativeCache());
            }
        });
    }

    private void registerCaffeineMetrics(String cacheName, Cache<Object, Object> cache) {
        // 캐시 히트율
        meterRegistry.gauge("cache.hit.rate", Tags.of("cache", cacheName), cache, 
            c -> c.stats().hitRate());
        
        // 캐시 미스율
        meterRegistry.gauge("cache.miss.rate", Tags.of("cache", cacheName), cache,
            c -> c.stats().missRate());
        
        // 캐시 로드 성공률
        meterRegistry.gauge("cache.load.success.rate", Tags.of("cache", cacheName), cache,
            c -> c.stats().loadSuccessCount() / (double) Math.max(1, c.stats().loadCount()));
        
        // 캐시 제거 수
        meterRegistry.gauge("cache.eviction.count", Tags.of("cache", cacheName), cache,
            c -> c.stats().evictionCount());
        
        // 캐시 크기
        meterRegistry.gauge("cache.size", Tags.of("cache", cacheName), cache,
            Cache::estimatedSize);
    }

    /**
     * 주기적으로 캐시 통계 로깅 (5분마다)
     */
    @Scheduled(fixedDelay = 5, timeUnit = TimeUnit.MINUTES)
    public void logCacheStatistics() {
        log.info("=== 캐시 통계 리포트 ===");
        
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache instanceof CaffeineCache) {
                CacheStats stats = ((CaffeineCache) cache).getNativeCache().stats();
                log.info("캐시 [{}] - 히트율: {:.2f}%, 미스율: {:.2f}%, 요청수: {}, 크기: {}",
                    cacheName,
                    stats.hitRate() * 100,
                    stats.missRate() * 100,
                    stats.requestCount(),
                    ((CaffeineCache) cache).getNativeCache().estimatedSize()
                );
            }
        });
        
        // Redis 캐시 정보
        logRedisStatistics();
    }
    
    private void logRedisStatistics() {
        try {
            var info = redisTemplate.getConnectionFactory().getConnection().info("stats");
            log.info("Redis 통계: {}", info);
        } catch (Exception e) {
            log.warn("Redis 통계 조회 실패", e);
        }
    }

    /**
     * 캐시 히트율이 낮을 때 경고 (1분마다 체크)
     */
    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.MINUTES)
    public void checkCacheHealth() {
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache instanceof CaffeineCache) {
                CacheStats stats = ((CaffeineCache) cache).getNativeCache().stats();
                if (stats.requestCount() > 100 && stats.hitRate() < 0.5) {
                    log.warn("캐시 [{}] 히트율이 낮습니다: {:.2f}%", cacheName, stats.hitRate() * 100);
                }
            }
        });
    }
}