package com.crimecat.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.metrics.cache.CacheMetricsRegistrar;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCache;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

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
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "management.metrics.cache.enabled",
    havingValue = "true",
    matchIfMissing = false
)
public class CacheMetricsConfig {
    private final CacheManager caffeineCacheManager;
    private final MeterRegistry meterRegistry;
    private final RedisTemplate<String, String> redisTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void registerCacheMetrics() {
        log.info("캐시 메트릭스 등록 시작");
        
        // Null check and defensive programming
        if (caffeineCacheManager == null) {
            log.warn("CacheManager is null, skipping metrics registration");
            return;
        }

        try {
            // Caffeine 캐시 메트릭스 등록
            caffeineCacheManager.getCacheNames().forEach(cacheName -> {
                var cache = caffeineCacheManager.getCache(cacheName);
                if (cache instanceof CaffeineCache) {
                    registerCaffeineMetrics(cacheName, ((CaffeineCache) cache).getNativeCache());
                }
            });
        } catch (Exception e) {
            log.error("Failed to register cache metrics", e);
        }
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

        caffeineCacheManager.getCacheNames().forEach(cacheName -> {
            var cache = caffeineCacheManager.getCache(cacheName);
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
        caffeineCacheManager.getCacheNames().forEach(cacheName -> {
            var cache = caffeineCacheManager.getCache(cacheName);
            if (cache instanceof CaffeineCache) {
                CacheStats stats = ((CaffeineCache) cache).getNativeCache().stats();

                // 히트율 체크 (50% 미만시 경고)
                if (stats.requestCount() > 100 && stats.hitRate() < 0.5) {
                    log.warn("⚠️ [CACHE_HEALTH] 캐시 [{}] 히트율이 낮습니다: {:.2f}%",
                            cacheName, stats.hitRate() * 100);
                }

                // 제거율 체크 (너무 많은 제거가 발생하는 경우)
                if (stats.requestCount() > 100 && stats.evictionCount() > stats.requestCount() * 0.1) {
                    log.warn("⚠️ [CACHE_HEALTH] 캐시 [{}] 제거율이 높습니다: {} 제거 / {} 요청",
                            cacheName, stats.evictionCount(), stats.requestCount());
                }

                // 메모리 사용량 체크
                long cacheSize = ((CaffeineCache) cache).getNativeCache().estimatedSize();
                if (cacheSize > 8000) { // 80% of 10K max size
                    log.warn("⚠️ [CACHE_HEALTH] 캐시 [{}] 크기가 큽니다: {} entries",
                            cacheName, cacheSize);
                }
            }
        });
    }

    /**
     * 캐시 성능 최적화 제안 (30분마다)
     */
    @Scheduled(fixedDelay = 30, timeUnit = TimeUnit.MINUTES)
    public void suggestCacheOptimizations() {
        log.info("🔍 [CACHE_OPTIMIZATION] 캐시 성능 분석 시작");

        caffeineCacheManager.getCacheNames().forEach(cacheName -> {
            var cache = caffeineCacheManager.getCache(cacheName);
            if (cache instanceof CaffeineCache) {
                CacheStats stats = ((CaffeineCache) cache).getNativeCache().stats();
                long requestCount = stats.requestCount();

                if (requestCount < 10) {
                    log.info("💡 [CACHE_OPTIMIZATION] 캐시 [{}]는 사용량이 적습니다 ({}회). 필요성 검토 권장",
                            cacheName, requestCount);
                } else if (stats.hitRate() > 0.9) {
                    log.info("✅ [CACHE_OPTIMIZATION] 캐시 [{}]는 매우 효율적입니다: {:.2f}% 히트율",
                            cacheName, stats.hitRate() * 100);
                } else if (stats.loadSuccessCount() > 0) {
                    double avgLoadTime = stats.averageLoadPenalty() / 1_000_000.0; // 나노초를 밀리초로
                    if (avgLoadTime > 100) {
                        log.info("💡 [CACHE_OPTIMIZATION] 캐시 [{}] 로드 시간이 깁니다: {:.2f}ms. TTL 연장 고려",
                                cacheName, avgLoadTime);
                    }
                }
            }
        });
    }
}