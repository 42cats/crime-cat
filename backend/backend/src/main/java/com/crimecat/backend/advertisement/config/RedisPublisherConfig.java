package com.crimecat.backend.advertisement.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis Pub/Sub 설정 - 광고 변경 이벤트 발행용
 */
@Slf4j
@Configuration
public class RedisPublisherConfig {
    
    /**
     * Pub/Sub용 RedisTemplate 설정
     * 광고 변경 이벤트를 Discord Bot에 실시간으로 전달하기 위한 설정
     */
    @Bean
    public RedisTemplate<String, Object> redisPublisherTemplate(RedisConnectionFactory factory, ObjectMapper objectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        // Key serializer (채널명)
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value serializer (메시지 내용)
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        serializer.setObjectMapper(objectMapper);
        
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        
        template.afterPropertiesSet();
        
        log.info("✅ Redis Publisher Template 설정 완료 - 광고 Pub/Sub 준비됨");
        return template;
    }
}