package com.crimecat.backend.config;

import com.crimecat.backend.messagemacro.service.BotCachePubSubListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/**
 * 봇 캐시 리스너 설정
 * Redis Pub/Sub 메시지 리스너를 Bean으로 등록하여 안정적 초기화
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class BotCacheListenerConfig {

    private final BotCachePubSubListener botCachePubSubListener;

    /**
     * Redis 메시지 리스너 컨테이너 Bean 등록
     * Spring에서 자동으로 초기화하고 관리
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        try {
            log.info("🔧 [BotCacheListener] Redis 메시지 리스너 컨테이너 초기화 시작");
            
            RedisMessageListenerContainer container = new RedisMessageListenerContainer();
            container.setConnectionFactory(connectionFactory);

            // 봇 캐시 Pub/Sub 이벤트 리스너 등록 - MessageListener 직접 사용
            container.addMessageListener(botCachePubSubListener, new PatternTopic("bot:cache:events"));

            // 컨테이너 시작 후 리스너 등록 상태 로그
            log.info("📢 [BotCacheListener] Pub/Sub 채널 'bot:cache:events' 구독 설정 완료");
            log.info("🎯 [BotCacheListener] 리스너 메서드: handleBotCacheEvent");
            log.info("✅ [BotCacheListener] 봇 캐시 Redis 메시지 리스너 Bean 등록 완료");
            
            return container;

        } catch (Exception e) {
            log.error("❌ [BotCacheListener] 봇 캐시 Redis 메시지 리스너 Bean 등록 실패", e);
            throw e;
        }
    }
}