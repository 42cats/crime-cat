package com.crimecat.backend.messagemacro.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.stereotype.Service;

/**
 * 봇 커맨드 캐시 무효화 서비스
 * Redis 키 이벤트를 감지하여 Spring Cache를 자동 무효화
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotCommandsCacheInvalidationService {

    private final ButtonAutomationService buttonAutomationService;
    private final RedisConnectionFactory redisConnectionFactory;
    private RedisMessageListenerContainer listenerContainer;

    private static final String BOT_COMMANDS_CACHE_KEY = "bot:commands:metadata";

    /**
     * 애플리케이션 시작 후 Redis 키 이벤트 리스너 등록 (현재 비활성화 - Pub/Sub 방식 사용)
     */
    // @EventListener(ApplicationReadyEvent.class)
    public void setupRedisKeyEventListener() {
        try {
            // Redis 메시지 리스너 컨테이너 생성 및 초기화
            listenerContainer = new RedisMessageListenerContainer();
            listenerContainer.setConnectionFactory(redisConnectionFactory);
            
            // 컨테이너 초기화 (중요!)
            listenerContainer.afterPropertiesSet();

            // 키 설정 이벤트 리스너 (SET 이벤트)
            MessageListenerAdapter setListener = new MessageListenerAdapter(this, "handleKeySetEvent");
            listenerContainer.addMessageListener(setListener, 
                new PatternTopic("__keyspace@0__:" + BOT_COMMANDS_CACHE_KEY));

            // 키 삭제 이벤트 리스너 (DEL 이벤트) - 봇이 기존 캐시 삭제할 때
            MessageListenerAdapter delListener = new MessageListenerAdapter(this, "handleKeyDeleteEvent");
            listenerContainer.addMessageListener(delListener, 
                new PatternTopic("__keyspace@0__:" + BOT_COMMANDS_CACHE_KEY));

            // 컨테이너 시작
            listenerContainer.start();
            log.info("✅ 봇 커맨드 캐시 Redis 키 이벤트 리스너 등록 완료");

        } catch (Exception e) {
            log.error("❌ Redis 키 이벤트 리스너 등록 실패", e);
        }
    }

    /**
     * Redis 키 SET 이벤트 처리 - 봇이 새로운 커맨드 캐시를 생성했을 때
     * @param message Redis 메시지
     * @param channel Redis 채널
     */
    public void handleKeySetEvent(String message, String channel) {
        if ("set".equals(message)) {
            log.info("🔄 [CacheInvalidation] 봇 커맨드 Redis 캐시 갱신 감지 - Spring Cache 무효화 실행");
            
            try {
                // Spring Cache 무효화
                buttonAutomationService.evictBotCommandsCache();
                
                log.info("✅ [CacheInvalidation] 봇 커맨드 Spring Cache 자동 무효화 완료");
                
            } catch (Exception e) {
                log.error("❌ [CacheInvalidation] Spring Cache 무효화 실패", e);
            }
        }
    }

    /**
     * Redis 키 DELETE 이벤트 처리 - 봇이 기존 캐시를 삭제했을 때
     * @param message Redis 메시지  
     * @param channel Redis 채널
     */
    public void handleKeyDeleteEvent(String message, String channel) {
        if ("del".equals(message)) {
            log.info("🗑️ [CacheInvalidation] 봇 커맨드 Redis 캐시 삭제 감지 - Spring Cache 무효화 실행");
            
            try {
                // Spring Cache 무효화
                buttonAutomationService.evictBotCommandsCache();
                
                log.info("✅ [CacheInvalidation] 봇 커맨드 Spring Cache 자동 무효화 완료");
                
            } catch (Exception e) {
                log.error("❌ [CacheInvalidation] Spring Cache 무효화 실패", e);
            }
        }
    }

    /**
     * 애플리케이션 종료 시 리스너 정리
     */
    public void cleanup() {
        if (listenerContainer != null) {
            try {
                listenerContainer.stop();
                listenerContainer.destroy();
                log.info("🚪 Redis 키 이벤트 리스너 정리 완료");
            } catch (Exception e) {
                log.error("❌ Redis 키 이벤트 리스너 정리 실패", e);
            }
        }
    }
}