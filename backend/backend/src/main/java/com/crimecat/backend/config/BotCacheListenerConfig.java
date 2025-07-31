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
            RedisMessageListenerContainer container = new RedisMessageListenerContainer();
            container.setConnectionFactory(connectionFactory);

            // 봇 캐시 Pub/Sub 이벤트 리스너 등록
            MessageListenerAdapter pubSubListener = new MessageListenerAdapter(botCachePubSubListener, "handleBotCacheEvent");
            container.addMessageListener(pubSubListener, new PatternTopic("bot:cache:events"));

            log.info("✅ 봇 캐시 Redis 메시지 리스너 Bean 등록 완료");
            return container;

        } catch (Exception e) {
            log.error("❌ 봇 캐시 Redis 메시지 리스너 Bean 등록 실패", e);
            throw e;
        }
    }
}