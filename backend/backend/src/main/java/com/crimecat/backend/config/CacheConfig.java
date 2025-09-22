package com.crimecat.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.Duration;
import java.util.Arrays;

/**
 * Caffeine 기반 로컬 캐시 설정
 * - 빈번한 읽기 및 빠른 응답이 필요한 데이터 캐싱
 * - 스케줄 관련 데이터 캐싱
 * - 메모리 효율성과 성능 최적화
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Caffeine 기반 로컬 캐시 매니저
     * - 빠른 접근이 필요한 데이터용 L1 캐시
     * - 메모리 효율성과 높은 성능 제공
     */
    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // Caffeine 캐시 기본 설정
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10_000)                          // 최대 1만개 엔트리
            .expireAfterWrite(Duration.ofMinutes(10))     // 생성 후 10분 만료
            .expireAfterAccess(Duration.ofMinutes(5))     // 마지막 접근 후 5분 만료
            .recordStats());                              // 통계 수집 활성화

        // 로컬 캐시로 관리할 캐시 목록 (빈번한 읽기, 빠른 응답 필요)
        cacheManager.setCacheNames(Arrays.asList(
            // === Caffeine 전용 캐시들 (CacheType 상수 사용) ===

            // 스케줄 관련 캐시 - iCal 파싱 데이터 캐싱
            CacheType.SCHEDULE_ICAL_DATA,    // iCal 파싱 데이터

            // 게임 테마 관련 - 빈번한 조회 데이터
            CacheType.GAME_THEME_ENTITY,     // 게임 테마 엔티티
            CacheType.USER_THEME_SUMMARY,    // 사용자별 테마 요약
            CacheType.VIEW_COUNT,            // 조회수

            // 사용자 관련 - 빈번한 권한 체크 및 프로필 조회
            CacheType.USER_PERMISSIONS,      // 사용자 권한
            CacheType.USER_PROFILE,          // 사용자 프로필

            // 봇 커맨드 - 메타데이터 캐싱
            CacheType.BOT_COMMANDS,          // 봇 커맨드 목록

            // 캘린더 관련 - 개인 데이터, 빈번한 접근
            CacheType.USER_CALENDARS,        // 사용자 캘린더 목록
            CacheType.PERSONAL_CALENDARS,    // 개인 캘린더
            CacheType.COLOR_PALETTE,         // 색상 팔레트
            CacheType.PERSONAL_CALENDAR_EVENTS,    // 개인 캘린더 이벤트
            CacheType.PERSONAL_BLOCKED_DATES,      // 개인 차단 날짜
            CacheType.UNIFIED_CALENDAR_EVENTS      // 통합 캘린더 이벤트
        ));

        // null 값 캐싱 비활성화
        cacheManager.setAllowNullValues(false);

        return cacheManager;
    }
}