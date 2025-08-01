package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.messagemacro.service.ButtonAutomationService;
import com.crimecat.backend.messagemacro.service.BotCommandsRedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 캐시 관리 컨트롤러 (개발/테스트용)
 * Redis 캐시와 Spring Cache 상태 확인 및 수동 무효화 제공
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/cache")
@RequiredArgsConstructor
public class CacheManagementController {

    private final ButtonAutomationService buttonAutomationService;
    private final BotCommandsRedisService botCommandsRedisService;

    /**
     * 봇 커맨드 Spring Cache 수동 무효화
     * 개발 및 디버깅 목적으로 사용
     */
    @PostMapping("/bot-commands/evict")
    public ResponseEntity<Map<String, Object>> evictBotCommandsCache() {
        try {
            log.info("🗑️ [CacheManagement] 봇 커맨드 Spring Cache 수동 무효화 요청");
            
            // Spring Cache 무효화 실행
            buttonAutomationService.evictBotCommandsCache();
            
            log.info("✅ [CacheManagement] 봇 커맨드 Spring Cache 무효화 완료");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "봇 커맨드 Spring Cache가 성공적으로 무효화되었습니다",
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("❌ [CacheManagement] Spring Cache 무효화 실패", e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Spring Cache 무효화 실패: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * 봇 커맨드 캐시 상태 확인
     * Redis 캐시와 Spring Cache 상태를 모두 확인
     */
    @GetMapping("/bot-commands/status")
    public ResponseEntity<Map<String, Object>> getBotCommandsCacheStatus() {
        try {
            log.info("🔍 [CacheManagement] 봇 커맨드 캐시 상태 확인 요청");
            
            // Redis 캐시 통계 조회
            Map<String, Object> redisStats = botCommandsRedisService.getCacheStats();
            
            // 현재 Spring Cache에서 데이터 조회 (실제 조회해서 개수 확인)
            var springCacheData = buttonAutomationService.getBotCommands();
            
            Map<String, Object> response = Map.of(
                "success", true,
                "redis", redisStats,
                "springCache", Map.of(
                    "commandCount", springCacheData.size(),
                    "sampleCommand", springCacheData.isEmpty() ? null : 
                        Map.of(
                            "name", springCacheData.get(0).getName(),
                            "parameterCount", springCacheData.get(0).getParameters().size(),
                            "subcommandCount", springCacheData.get(0).getSubcommands() != null ? 
                                springCacheData.get(0).getSubcommands().size() : 0
                        )
                ),
                "timestamp", System.currentTimeMillis()
            );
            
            log.info("📊 [CacheManagement] 캐시 상태: Redis={}, Spring={} 커맨드", 
                    redisStats.get("commandCount"), springCacheData.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [CacheManagement] 캐시 상태 확인 실패", e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "캐시 상태 확인 실패: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }
}