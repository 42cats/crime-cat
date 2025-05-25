package com.crimecat.backend.config;

import com.crimecat.backend.gametheme.service.GameThemeService;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.utils.RedisCacheService;
import com.crimecat.backend.utils.RedisDbType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 캐시 예열 서비스
 * - 서버 시작 시 주요 데이터를 미리 캐시에 로드
 * - 정기적으로 캐시 갱신
 */
@Slf4j
@Service
@EnableAsync
@RequiredArgsConstructor
public class CacheWarmupService {

    private final PermissionService permissionService;
    private final RedisCacheService redisCacheService;

    /**
     * 애플리케이션 시작 후 캐시 예열
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void warmupCacheOnStartup() {
        log.info("캐시 예열 시작...");
        
        CompletableFuture<Void> permissionWarmup = warmupPermissions();
        CompletableFuture<Void> statsWarmup = warmupStatistics();
        
        CompletableFuture.allOf(permissionWarmup, statsWarmup)
            .thenRun(() -> log.info("캐시 예열 완료"))
            .exceptionally(ex -> {
                log.error("캐시 예열 중 오류 발생", ex);
                return null;
            });
    }

    /**
     * 권한 캐시 예열
     */
    @Async
    public CompletableFuture<Void> warmupPermissions() {
        try {
            log.info("권한 캐시 예열 시작");
            // 모든 권한 목록 캐시
            permissionService.getAllPermissions();
            log.info("권한 캐시 예열 완료");
        } catch (Exception e) {
            log.error("권한 캐시 예열 실패", e);
        }
        return CompletableFuture.completedFuture(null);
    }

    /**
     * 통계 캐시 예열
     */
    @Async
    public CompletableFuture<Void> warmupStatistics() {
        try {
            log.info("통계 캐시 예열 시작");
            
            // 전체 사용자 수
            redisCacheService.saveString(RedisDbType.ALL_USER_COUNT, "0");
            
            // 제작자 수
            redisCacheService.saveString(RedisDbType.MAKER_COUNT, "0");
            
            // 등록된 테마 수
            redisCacheService.saveString(RedisDbType.REGISTERED_THEME, "0");
            
            log.info("통계 캐시 예열 완료");
        } catch (Exception e) {
            log.error("통계 캐시 예열 실패", e);
        }
        return CompletableFuture.completedFuture(null);
    }

    /**
     * 매일 새벽 3시에 캐시 갱신
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void refreshCacheDaily() {
        log.info("일일 캐시 갱신 시작");
        warmupCacheOnStartup();
    }

    /**
     * 30분마다 인기 데이터 캐시 갱신
     */
    @Scheduled(fixedDelay = 30, timeUnit = TimeUnit.MINUTES)
    public void refreshPopularDataCache() {
        log.info("인기 데이터 캐시 갱신 시작");
        
        try {
            // 인기 게임 테마, 최신 게시글 등 자주 조회되는 데이터 갱신
            // 실제 구현은 비즈니스 요구사항에 따라 추가
        } catch (Exception e) {
            log.error("인기 데이터 캐시 갱신 실패", e);
        }
    }
}