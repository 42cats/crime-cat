package com.crimecat.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 통합된 캐시 설정
 * - iCalendar 파싱 결과 캐싱
 * - 스케줄 관련 데이터 캐싱
 * - 성능 최적화된 캐시 전략
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 통합된 캐시 이름들
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "SCHEDULE_ICAL_DATA",        // iCal 파싱 데이터 (통합)
            "SCHEDULE_EVENT_LIST",       // 이벤트 목록
            "SCHEDULE_EVENT_DETAIL",     // 이벤트 상세
            "SCHEDULE_PARTICIPANTS",     // 참여자 정보
            "SCHEDULE_AVAILABILITY",     // 가용성 정보
            "SCHEDULE_USER_CALENDAR"     // 사용자 캘린더
        ));
        
        // 캐시 동적 생성 허용
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }
}