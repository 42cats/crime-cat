package com.crimecat.backend.config;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine 전용 캐시 타입 정의
 * - 각 캐시별 개별 TTL, 크기, 정책 설정
 * - 메모리 기반 로컬 캐시용
 * - Redis와 분리된 독립적인 캐시 관리
 *
 * Gradle generateCacheNames 태스크를 통해 CacheNames 클래스가 자동 생성됩니다.
 * Spring @Cacheable, @CacheEvict 애너테이션에서 CacheNames.XXX 상수를 사용하세요.
 */
public enum CaffeineCacheType {

    // === 게임 테마 관련 (자주 조회, 긴 TTL) ===
    GAME_THEME_ENTITY("game:theme:entity", 30, TimeUnit.MINUTES, 5000),
    USER_THEME_SUMMARY("user:theme:summary", 15, TimeUnit.MINUTES, 2000),

    // === 사용자 관련 (중간 TTL) ===
    USER_PERMISSIONS("user:permissions", 10, TimeUnit.MINUTES, 3000),
    USER_PROFILE("user:profile", 10, TimeUnit.MINUTES, 1000),

    // === 게시판 관련 (짧은 TTL - 새로 추가) ===
    POST_NAVIGATION("post:navigation", 5, TimeUnit.MINUTES, 1000),
    BOARD_POST_DETAIL("board:post:detail", 3, TimeUnit.MINUTES, 2000),

    // === 통계 관련 (매우 긴 TTL) ===
    VIEW_COUNT("view:count", 60, TimeUnit.MINUTES, 10000),
    WEB_STATS("web:stats", 60, TimeUnit.MINUTES, 100),

    // === 스케줄 관련 (기존 유지) ===
    SCHEDULE_ICAL_DATA("schedule:ical:data", 30, TimeUnit.MINUTES, 500),
    SCHEDULE_EVENTS("schedule:events", 15, TimeUnit.MINUTES, 1000),

    // === 캘린더 관련 (기존 유지) ===
    USER_CALENDARS("user:calendars", 10, TimeUnit.MINUTES, 1000),
    UNIFIED_CALENDAR_EVENTS("unified:calendar:events", 5, TimeUnit.MINUTES, 2000),
    PERSONAL_CALENDAR_EVENTS("personal:calendar:events", 10, TimeUnit.MINUTES, 1500),
    PERSONAL_BLOCKED_DATES("personal:blocked:dates", 15, TimeUnit.MINUTES, 1000),
    COLOR_PALETTE("color:palette", 30, TimeUnit.MINUTES, 500),
    PERSONAL_CALENDARS("personal:calendars", 10, TimeUnit.MINUTES, 1000),

    // === 봇 커맨드 관련 ===
    BOT_COMMANDS("bot:commands", 30, TimeUnit.MINUTES, 1000);

    private final String cacheName;
    private final long duration;
    private final TimeUnit timeUnit;
    private final int maximumSize;

    CaffeineCacheType(String cacheName, long duration, TimeUnit timeUnit, int maximumSize) {
        this.cacheName = cacheName;
        this.duration = duration;
        this.timeUnit = timeUnit;
        this.maximumSize = maximumSize;
    }

    /**
     * 캐시명 반환 - @Cacheable에서 사용
     */
    public String getCacheName() {
        return cacheName;
    }

    /**
     * TTL 기간 반환
     */
    public long getDuration() {
        return duration;
    }

    /**
     * TTL 시간 단위 반환
     */
    public TimeUnit getTimeUnit() {
        return timeUnit;
    }

    /**
     * 최대 엔트리 수 반환
     */
    public int getMaximumSize() {
        return maximumSize;
    }

    /**
     * 디버그용 정보 반환
     */
    @Override
    public String toString() {
        return String.format("CaffeineCacheType{name='%s', duration=%d %s, maxSize=%d}",
                cacheName, duration, timeUnit, maximumSize);
    }
}