package com.crimecat.backend.messagemacro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 봇 캐시 Pub/Sub 리스너
 * 봇에서 전송하는 캐시 갱신 이벤트를 수신하여 Spring Cache 자동 무효화
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotCachePubSubListener {

    private final ButtonAutomationService buttonAutomationService;
    private final ObjectMapper objectMapper;

    /**
     * 봇 캐시 이벤트 처리
     * @param message 봇에서 전송한 JSON 메시지
     * @param channel Pub/Sub 채널명
     */
    public void handleBotCacheEvent(String message, String channel) {
        try {
            log.debug("📨 [BotCachePubSub] 메시지 수신: {}", message);

            // JSON 메시지 파싱
            @SuppressWarnings("unchecked")
            Map<String, Object> eventData = objectMapper.readValue(message, Map.class);
            
            String event = (String) eventData.get("event");
            String cacheKey = (String) eventData.get("cacheKey");
            String timestamp = (String) eventData.get("timestamp");
            String botVersion = (String) eventData.get("botVersion");

            log.info("🔔 [BotCachePubSub] 봇 캐시 이벤트 수신 - event: {}, cacheKey: {}, botVersion: {}, timestamp: {}", 
                    event, cacheKey, botVersion, timestamp);

            // 봇 커맨드 캐시 갱신 이벤트 처리
            if ("bot_commands_cache_updated".equals(event) && "bot:commands:metadata".equals(cacheKey)) {
                
                log.info("🔄 [BotCachePubSub] 봇 커맨드 캐시 갱신 감지 - Spring Cache 자동 무효화 실행");
                
                // Spring Cache 무효화
                buttonAutomationService.evictBotCommandsCache();
                
                log.info("✅ [BotCachePubSub] 봇 커맨드 Spring Cache 자동 무효화 완료 (botVersion: {})", botVersion);
                
            } else {
                log.debug("ℹ️ [BotCachePubSub] 알 수 없는 이벤트 또는 캐시 키: {} / {}", event, cacheKey);
            }

        } catch (Exception e) {
            log.error("❌ [BotCachePubSub] 봇 캐시 이벤트 처리 실패: {}", message, e);
        }
    }
}