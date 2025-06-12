package com.crimecat.backend.advertisement.config;

import com.crimecat.backend.advertisement.service.DiscordBotCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 테마 광고 캐시 초기화 및 주기적 갱신
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ThemeAdvertisementCacheInitializer {
    
    private final DiscordBotCacheService discordBotCacheService;
    
    /**
     * 애플리케이션 시작 시 캐시 초기화
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeCacheOnStartup() {
        log.info("테마 광고 캐시 초기화 시작");
        try {
            discordBotCacheService.updateActiveAdvertisementsCache();
            log.info("테마 광고 캐시 초기화 완료");
        } catch (Exception e) {
            log.error("테마 광고 캐시 초기화 실패", e);
        }
    }
    
    /**
     * 30분마다 캐시 갱신 (TTL이 1시간이므로 만료되기 전에 갱신)
     */
    @Scheduled(fixedDelay = 30 * 60 * 1000) // 30분
    public void refreshCachePeriodically() {
        log.debug("테마 광고 캐시 주기적 갱신 시작");
        try {
            discordBotCacheService.updateActiveAdvertisementsCache();
            log.debug("테마 광고 캐시 주기적 갱신 완료");
        } catch (Exception e) {
            log.error("테마 광고 캐시 주기적 갱신 실패", e);
        }
    }
}