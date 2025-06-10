package com.crimecat.backend.advertisement.controller;

import com.crimecat.backend.advertisement.service.DiscordBotCacheService;
import com.crimecat.backend.advertisement.service.ThemeAdvertisementQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 디스코드 봇 전용 테마 광고 API 컨트롤러
 */
@RestController
@RequestMapping("/api/bot/v1/theme-ads")
@RequiredArgsConstructor
public class ThemeAdvertisementBotController {
    
    private final ThemeAdvertisementQueueService queueService;
    private final DiscordBotCacheService discordBotCacheService;
    
    /**
     * 활성 광고 목록 조회 (디스코드 봇용)
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveAdvertisements() {
        return ResponseEntity.ok(queueService.getActiveAdvertisements());
    }
    
    /**
     * 디스코드 봇 캐시 수동 업데이트
     */
    @PostMapping("/cache/refresh")
    public ResponseEntity<String> refreshDiscordCache() {
        discordBotCacheService.updateActiveAdvertisementsCache();
        return ResponseEntity.ok("디스코드 봇 캐시 업데이트 완료");
    }
    
    /**
     * 광고 노출 기록 (디스코드 봇용)
     */
    @PostMapping("/exposure/{requestId}")
    public ResponseEntity<String> recordExposure(@PathVariable UUID requestId) {
        try {
            queueService.recordExposure(requestId);
            return ResponseEntity.ok("노출 기록 완료");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("노출 기록 실패: " + e.getMessage());
        }
    }
    
    /**
     * 광고 클릭 기록 (디스코드 봇용)
     */
    @PostMapping("/click/{requestId}")
    public ResponseEntity<String> recordClick(@PathVariable UUID requestId) {
        try {
            queueService.recordClick(requestId);
            return ResponseEntity.ok("클릭 기록 완료");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("클릭 기록 실패: " + e.getMessage());
        }
    }
}