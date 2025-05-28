package com.crimecat.backend.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * 통합 Redis 설정
 * - Redis 연결 설정
 * - 직렬화 설정 (타입 정보 포함)
 * - 캐시 매니저 설정
 */
@Configuration
@EnableCaching
public class UnifiedRedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    /**
     * Redis 연결 팩토리
     */
    @Bean
    @ConditionalOnMissingBean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(redisHost, redisPort);
    }

    /**
     * Redis 직렬화 전용 ObjectMapper - 단순 JSON 직렬화
     */
    @Bean
    @Primary
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Java 8 Time 모듈 등록
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // 알 수 없는 속성 무시
        objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // 빈 객체 직렬화 허용
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        return objectMapper;
    }

    /**
     * 문자열 템플릿용 RedisTemplate
     */
    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    /**
     * 객체 직렬화용 RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisObjectTemplate(
            RedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // 키는 문자열로 직렬화
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // 값은 단순 JSON으로 직렬화 (타입 정보 없음)
        Jackson2JsonRedisSerializer<Object> jsonSerializer = 
                new Jackson2JsonRedisSerializer<>(redisObjectMapper, Object.class);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Redis 캐시 매니저
     */
    @Bean
    @Primary
    public RedisCacheManager redisCacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {
        
        Jackson2JsonRedisSerializer<Object> serializer = 
                new Jackson2JsonRedisSerializer<>(redisObjectMapper, Object.class);
        
        // 기본 캐시 설정
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serializer))
                .disableCachingNullValues();
        
        // 캐시별 개별 TTL 설정
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 게임 테마 목록 - 5분
        cacheConfigurations.put("game:theme:list", 
                defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // 게임 테마 상세 - 30분
        cacheConfigurations.put("game:theme", 
                defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // 게임 테마 좋아요 - 10분
        cacheConfigurations.put("game:theme:like", 
                defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // 사용자별 테마 요약 - 15분
        cacheConfigurations.put("user:theme:summary", 
                defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // 사용자 프로필 - 10분
        cacheConfigurations.put("user:profile", 
                defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // 사용자 권한 - 15분
        cacheConfigurations.put("user:permissions", 
                defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // 통합 게임 기록 - 10분
        cacheConfigurations.put(CacheType.INTEGRATED_HISTORIES, 
                defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // 게시판 목록 - 2분
        cacheConfigurations.put("board:post:list", 
                defaultConfig.entryTtl(Duration.ofMinutes(2)));
        
        // 검색 결과 - 5분
        cacheConfigurations.put("search:users", 
                defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // 조회수 - 1분
        cacheConfigurations.put(CacheType.VIEW_COUNT, 
                defaultConfig.entryTtl(Duration.ofMinutes(1)));
        
        // Discord API 캐시 - 길드 정보 30분
        cacheConfigurations.put(CacheType.DISCORD_GUILD_INFO, 
                defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Discord API 캐시 - 채널 목록 15분
        cacheConfigurations.put(CacheType.DISCORD_GUILD_CHANNELS, 
                defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // 네이버 API 캐시 - 지역 검색 1시간
        cacheConfigurations.put(CacheType.NAVER_LOCAL_SEARCH, 
                defaultConfig.entryTtl(Duration.ofHours(1)));
        
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}