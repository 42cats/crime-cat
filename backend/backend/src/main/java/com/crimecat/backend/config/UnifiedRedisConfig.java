package com.crimecat.backend.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Qualifier;
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
 * Redis 기반 분산 캐시 설정
 * - Redis 연결 설정
 * - 직렬화 설정 (타입 정보 포함)
 * - 분산 환경 및 영속성이 필요한 캐시 전용
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
     * Redis 직렬화 전용 ObjectMapper - 타입 정보 포함 (캐시 내부용)
     */
    @Bean("redisObjectMapper")
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Java 8 Time 모듈 등록
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // 알 수 없는 속성 무시
        objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // 빈 객체 직렬화 허용
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        // 타입 정보 활성화 (Redis 캐시 내부에서만 사용)
        objectMapper.activateDefaultTyping(
            objectMapper.getPolymorphicTypeValidator(),
            ObjectMapper.DefaultTyping.NON_FINAL,
            com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY
        );
        
        // 모든 속성 접근 가능
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        
        return objectMapper;
    }

    /**
     * API 응답용 ObjectMapper - 타입 정보 제외 (프론트엔드용)
     */
    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Java 8 Time 모듈 등록
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // 알 수 없는 속성 무시
        objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        
        // 빈 객체 직렬화 허용
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        
        // 타입 정보 비활성화 (API 응답에서 @class 제거)
        objectMapper.deactivateDefaultTyping();
        
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
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
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
     * Redis 캐시 매니저 - 분산 환경 및 영속성이 필요한 캐시용
     */
    @Bean("redisCacheManager")
    public RedisCacheManager redisCacheManager(
            RedisConnectionFactory connectionFactory,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
        
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
        
        // === 분산 환경 및 영속성이 필요한 Redis 전용 캐시 ===
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // === 외부 API 캐시 (높은 지연시간, 분산 공유 필요) ===

        // Discord API 캐시 - 길드 정보 30분
        cacheConfigurations.put(CacheType.DISCORD_GUILD_INFO,
                defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Discord API 캐시 - 채널 목록 15분
        cacheConfigurations.put(CacheType.DISCORD_GUILD_CHANNELS,
                defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Discord API 캐시 - 역할 목록 15분
        cacheConfigurations.put(CacheType.DISCORD_GUILD_ROLES,
                defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // 네이버 API 캐시 - 지역 검색 1시간
        cacheConfigurations.put(CacheType.NAVER_LOCAL_SEARCH,
                defaultConfig.entryTtl(Duration.ofHours(1)));

        // === 통계 API 캐시 (무거운 집계 연산, 분산 동기화) ===

        cacheConfigurations.put("totalServers",
                defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("totalUsers",
                defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("totalPlayers",
                defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("totalCreators",
                defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("crimeThemes",
                defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("escapeThemes",
                defaultConfig.entryTtl(Duration.ofHours(1)));

        // === 복합 게임 히스토리 캐시 (복잡한 집계, 영속성 필요) ===

        cacheConfigurations.put("integratedGameHistory",
                defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("userGameStatistics",
                defaultConfig.entryTtl(Duration.ofMinutes(15)));
        cacheConfigurations.put("userProfileStats",
                defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("escapeRoomThemeStats",
                defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // === 테마 광고 캐시 (실시간 업데이트, 분산 동기화 필요) ===

        cacheConfigurations.put(CacheType.THEME_AD_ACTIVE,
                defaultConfig.entryTtl(Duration.ofMinutes(1))); // 활성 광고 - 1분

        cacheConfigurations.put(CacheType.THEME_AD_QUEUE,
                defaultConfig.entryTtl(Duration.ofMinutes(2))); // 광고 대기열 - 2분

        cacheConfigurations.put(CacheType.THEME_AD_USER_REQUESTS,
                defaultConfig.entryTtl(Duration.ofMinutes(3))); // 사용자 광고 요청 - 3분

        cacheConfigurations.put(CacheType.THEME_AD_STATS,
                defaultConfig.entryTtl(Duration.ofMinutes(5))); // 개별 광고 통계 - 5분

        cacheConfigurations.put(CacheType.THEME_AD_USER_STATS,
                defaultConfig.entryTtl(Duration.ofMinutes(5))); // 사용자 광고 통계 - 5분

        cacheConfigurations.put(CacheType.THEME_AD_USER_SUMMARY,
                defaultConfig.entryTtl(Duration.ofMinutes(5))); // 사용자 광고 요약 - 5분

        cacheConfigurations.put(CacheType.THEME_AD_PLATFORM_STATS,
                defaultConfig.entryTtl(Duration.ofMinutes(10))); // 플랫폼 통계 - 10분

        // === 사이트맵 캐시 (SEO 최적화, 영속성 필요) ===

        cacheConfigurations.put(CacheType.SITEMAP_INDEX,
                defaultConfig.entryTtl(Duration.ofHours(1))); // 사이트맵 인덱스 - 1시간

        cacheConfigurations.put(CacheType.SITEMAP_THEMES,
                defaultConfig.entryTtl(Duration.ofMinutes(30))); // 테마 사이트맵 - 30분

        cacheConfigurations.put(CacheType.SITEMAP_POSTS,
                defaultConfig.entryTtl(Duration.ofMinutes(30))); // 게시글 사이트맵 - 30분

        cacheConfigurations.put(CacheType.SITEMAP_PROFILES,
                defaultConfig.entryTtl(Duration.ofHours(1))); // 프로필 사이트맵 - 1시간

        cacheConfigurations.put(CacheType.SITEMAP_SNS,
                defaultConfig.entryTtl(Duration.ofMinutes(30))); // SNS 사이트맵 - 30분

        cacheConfigurations.put(CacheType.SITEMAP_NOTICES,
                defaultConfig.entryTtl(Duration.ofHours(1))); // 공지사항 사이트맵 - 1시간

        cacheConfigurations.put(CacheType.SITEMAP_COMMANDS,
                defaultConfig.entryTtl(Duration.ofHours(2))); // 명령어 사이트맵 - 2시간

        cacheConfigurations.put(CacheType.SITEMAP_GAME_THEMES,
                defaultConfig.entryTtl(Duration.ofMinutes(30))); // 게임테마 사이트맵 - 30분

        // === 일정 관리 캐시 (실시간 동기화, 분산 공유 필요) ===

        cacheConfigurations.put(CacheType.SCHEDULE_EVENT_LIST,
                defaultConfig.entryTtl(Duration.ofMinutes(2))); // 일정 목록 - 2분 (실시간성 중요)

        cacheConfigurations.put(CacheType.SCHEDULE_EVENT_DETAIL,
                defaultConfig.entryTtl(Duration.ofMinutes(10))); // 일정 상세 - 10분

        cacheConfigurations.put(CacheType.SCHEDULE_PARTICIPANTS,
                defaultConfig.entryTtl(Duration.ofMinutes(1))); // 참여자 목록 - 1분 (참여 상태 변경 빈도 높음)

        cacheConfigurations.put(CacheType.SCHEDULE_AVAILABILITY,
                defaultConfig.entryTtl(Duration.ofMinutes(15))); // 가용시간 계산 - 15분 (계산 복잡도 높음)

        cacheConfigurations.put(CacheType.SCHEDULE_ICAL_PARSED,
                defaultConfig.entryTtl(Duration.ofMinutes(30))); // iCalendar 파싱 결과 - 30분 (외부 API 호출 최소화)

        cacheConfigurations.put(CacheType.SCHEDULE_USER_CALENDAR,
                defaultConfig.entryTtl(Duration.ofMinutes(10))); // 사용자 캘린더 정보 - 10분

        cacheConfigurations.put(CacheType.SCHEDULE_USER_BLOCKED_DATES,
                defaultConfig.entryTtl(Duration.ofMinutes(10))); // 사용자 차단 날짜 - 10분

        cacheConfigurations.put(CacheType.SCHEDULE_RECOMMENDED_TIMES,
                defaultConfig.entryTtl(Duration.ofMinutes(5))); // 추천 시간 - 5분 (계산 복잡도 높음)
        
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}