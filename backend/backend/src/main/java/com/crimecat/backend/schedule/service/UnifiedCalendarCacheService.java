package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.dto.response.CalendarEventsResponse;
import com.crimecat.backend.schedule.dto.MyScheduleResponse;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 통합 캘린더 캐싱 서비스
 * - Discord 봇, 웹 API 공통 캐싱 시스템
 * - 30분 TTL + 강제 새로고침 지원
 * - 중복 API 통합 처리
 */
@Slf4j
@Service
public class UnifiedCalendarCacheService {

    private final MultipleCalendarService multipleCalendarService;
    private final WebUserRepository webUserRepository;
    private final OptimizedBlockedDateService blockedDateService;
    private final DateFormatService dateFormatService;
    private final RedisTemplate<String, Object> redisTemplate;

    public UnifiedCalendarCacheService(
            MultipleCalendarService multipleCalendarService,
            WebUserRepository webUserRepository,
            OptimizedBlockedDateService blockedDateService,
            DateFormatService dateFormatService,
            @Qualifier("redisObjectTemplate") RedisTemplate<String, Object> redisTemplate) {
        this.multipleCalendarService = multipleCalendarService;
        this.webUserRepository = webUserRepository;
        this.blockedDateService = blockedDateService;
        this.dateFormatService = dateFormatService;
        this.redisTemplate = redisTemplate;
    }

    // 캐시 설정
    private static final String CACHE_PREFIX = "unified:calendar:events";
    private static final int CACHE_TTL_MINUTES = 30;
    private static final String CACHE_FORCE_REFRESH_KEY = "unified:calendar:force_refresh:%s";

    /**
     * 통합 캘린더 이벤트 조회 (캐싱 적용)
     * @param userId 사용자 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 통합 캘린더 이벤트 응답
     */
    @Cacheable(value = CACHE_PREFIX, key = "#userId + ':' + #startDate + ':' + #endDate")
    @Transactional(readOnly = true)
    public CalendarEventsResponse getCachedCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 [UNIFIED_CACHE] 캘린더 이벤트 조회 시작: userId={}, range={} ~ {}", userId, startDate, endDate);
        
        try {
            // 1. 모든 활성 캘린더 동기화 (부분 실패 허용)
            try {
                multipleCalendarService.syncAllUserCalendars(userId);
                log.debug("✅ [SYNC_SUCCESS] 캘린더 동기화 완료: userId={}", userId);
            } catch (Exception e) {
                log.warn("⚠️ [SYNC_WARNING] 캘린더 동기화 중 일부 실패 (계속 진행): userId={}, error={}", 
                        userId, e.getMessage());
            }

            // 2. 그룹화된 캘린더 이벤트 조회
            Map<String, MultipleCalendarService.CalendarGroup> calendarGroups = 
                multipleCalendarService.getGroupedCalendarEvents(userId, startDate, endDate);

            // 3. 원본 이벤트 데이터 추출 및 범위 필터링
            List<CalendarEventsResponse.CalendarEvent> rawEvents = calendarGroups.values().stream()
                .flatMap(group -> group.getEvents().stream())
                .filter(event -> {
                    LocalDate eventDate = event.getStartTime().toLocalDate();
                    return !eventDate.isBefore(startDate) && !eventDate.isAfter(endDate);
                })
                .map(this::convertToUnifiedEvent)
                .collect(Collectors.toList());

            // 4. 통계 정보 생성
            CalendarEventsResponse.CalendarStatistics statistics = buildStatistics(calendarGroups, rawEvents);

            // 5. 통합 응답 객체 생성
            CalendarEventsResponse response = CalendarEventsResponse.builder()
                    .userId(userId)
                    .startDate(startDate)
                    .endDate(endDate)
                    .retrievedAt(LocalDateTime.now())
                    .calendarGroups(calendarGroups)
                    .rawEvents(rawEvents)
                    .statistics(statistics)
                    .build();

            log.info("✅ [UNIFIED_CACHE] 캘린더 이벤트 조회 완료: userId={}, totalEvents={}, totalCalendars={}", 
                    userId, rawEvents.size(), calendarGroups.size());

            return response;

        } catch (Exception e) {
            log.error("❌ [UNIFIED_CACHE] 캘린더 이벤트 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            
            // 빈 응답 반환 (캐시 오염 방지)
            return CalendarEventsResponse.builder()
                    .userId(userId)
                    .startDate(startDate)
                    .endDate(endDate)
                    .retrievedAt(LocalDateTime.now())
                    .calendarGroups(Map.of())
                    .rawEvents(List.of())
                    .statistics(CalendarEventsResponse.CalendarStatistics.builder()
                            .totalCalendars(0)
                            .successfulCalendars(0)
                            .totalEvents(0)
                            .failedCalendars(0)
                            .lastSyncedAt(LocalDateTime.now())
                            .hasErrors(true)
                            .errorMessages(List.of(e.getMessage()))
                            .build())
                    .build();
        }
    }

    /**
     * Discord 봇용 내일정 조회 (캐싱 적용)
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param months 조회할 개월 수
     * @return Discord 봇용 응답
     */
    public MyScheduleResponse getDiscordSchedule(String discordSnowflake, int months) {
        log.info("🤖 [DISCORD_CACHE] Discord 일정 조회: snowflake={}, months={}", discordSnowflake, months);

        try {
            // Discord ID → WebUser 조회
            var webUser = webUserRepository.findByDiscordUserSnowflake(discordSnowflake)
                    .orElseThrow(() -> new RuntimeException("Discord 사용자를 찾을 수 없습니다"));

            // 날짜 범위 설정
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusMonths(months);

            // 통합 캐시에서 이벤트 조회
            CalendarEventsResponse cachedEvents = getCachedCalendarEvents(webUser.getId(), startDate, endDate);

            // 웹 차단 날짜 조회
            Set<LocalDate> blockedDates = blockedDateService.getUserBlockedDatesInRange(
                    webUser.getId(), startDate, endDate);

            // Discord 응답 생성 (사용 가능한 날짜 계산 포함)
            MyScheduleResponse response = buildDiscordResponse(
                    cachedEvents, discordSnowflake, months, startDate, endDate, blockedDates);

            log.info("✅ [DISCORD_CACHE] Discord 일정 조회 완료: snowflake={}, totalEvents={}", 
                    discordSnowflake, cachedEvents.getStatistics().getTotalEvents());

            return response;

        } catch (Exception e) {
            log.error("❌ [DISCORD_CACHE] Discord 일정 조회 실패: snowflake={}, error={}", 
                    discordSnowflake, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 강제 새로고침 (캐시 무효화 + 즉시 재조회)
     * @param userId 사용자 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 새로 조회된 이벤트 데이터
     */
    @CacheEvict(value = CACHE_PREFIX, key = "#userId + ':' + #startDate + ':' + #endDate")
    public CalendarEventsResponse forceRefreshCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.info("🔄 [FORCE_REFRESH] 캘린더 이벤트 강제 새로고침: userId={}, range={} ~ {}", 
                userId, startDate, endDate);

        // 강제 새로고침 마커 설정 (중복 요청 방지)
        String forceRefreshKey = String.format(CACHE_FORCE_REFRESH_KEY, userId);
        if (redisTemplate.hasKey(forceRefreshKey)) {
            log.warn("⚠️ [FORCE_REFRESH] 이미 새로고침 진행 중: userId={}", userId);
            // 기존 캐시 반환
            return getCachedCalendarEvents(userId, startDate, endDate);
        }

        try {
            // 새로고침 진행 중 마커 설정 (60초)
            redisTemplate.opsForValue().set(forceRefreshKey, "refreshing", 60, TimeUnit.SECONDS);

            // 캐시 무효화 후 새로 조회
            CalendarEventsResponse response = getCachedCalendarEvents(userId, startDate, endDate);

            log.info("✅ [FORCE_REFRESH] 강제 새로고침 완료: userId={}, totalEvents={}", 
                    userId, response.getStatistics().getTotalEvents());

            return response;

        } finally {
            // 새로고침 마커 제거
            redisTemplate.delete(forceRefreshKey);
        }
    }

    /**
     * 사용자별 캐시 전체 무효화
     * @param userId 사용자 ID
     */
    @CacheEvict(value = CACHE_PREFIX, allEntries = true)  // 패턴 매칭이 어려워 전체 무효화
    public void invalidateUserCache(UUID userId) {
        log.info("🗑️ [CACHE_EVICT] 사용자 캐시 무효화: userId={}", userId);
        
        // Redis에서 해당 사용자의 캐시 키 패턴 삭제
        try {
            String pattern = CACHE_PREFIX + "::" + userId + ":*";
            Set<String> keys = redisTemplate.keys(pattern);
            
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("✅ [CACHE_EVICT] {} 개 캐시 키 삭제 완료", keys.size());
            }
        } catch (Exception e) {
            log.error("❌ [CACHE_EVICT] 캐시 무효화 실패: userId={}, error={}", userId, e.getMessage(), e);
        }
    }

    /**
     * MultipleCalendarService의 CalendarEvent → 통합 CalendarEvent 변환
     */
    private CalendarEventsResponse.CalendarEvent convertToUnifiedEvent(
            com.crimecat.backend.schedule.service.MultipleCalendarService.CalendarEvent event) {
        
        return CalendarEventsResponse.CalendarEvent.builder()
                .id(event.getId())
                .title(event.getTitle())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .allDay(false)  // MultipleCalendarService.CalendarEvent에는 allDay 필드가 없음
                .source(event.getSource())
                .calendarId(event.getCalendarId())
                .calendarName(event.getCalendarName())
                .colorHex(event.getColorHex())
                .eventDate(event.getStartTime().toLocalDate())
                .build();
    }

    /**
     * 통계 정보 생성
     */
    private CalendarEventsResponse.CalendarStatistics buildStatistics(
            Map<String, MultipleCalendarService.CalendarGroup> calendarGroups,
            List<CalendarEventsResponse.CalendarEvent> rawEvents) {
        
        int totalCalendars = calendarGroups.size();
        int successfulCalendars = (int) calendarGroups.values().stream()
                .mapToLong(group -> group.getSyncStatus() == com.crimecat.backend.schedule.domain.UserCalendar.SyncStatus.SUCCESS ? 1 : 0)
                .sum();
        int failedCalendars = totalCalendars - successfulCalendars;
        
        LocalDateTime lastSynced = calendarGroups.values().stream()
                .map(MultipleCalendarService.CalendarGroup::getLastSynced)
                .filter(date -> date != null)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        List<String> errorMessages = calendarGroups.values().stream()
                .filter(group -> group.getSyncError() != null)
                .map(MultipleCalendarService.CalendarGroup::getSyncError)
                .collect(Collectors.toList());

        return CalendarEventsResponse.CalendarStatistics.builder()
                .totalCalendars(totalCalendars)
                .successfulCalendars(successfulCalendars)
                .totalEvents(rawEvents.size())
                .failedCalendars(failedCalendars)
                .lastSyncedAt(lastSynced)
                .hasErrors(!errorMessages.isEmpty())
                .errorMessages(errorMessages)
                .build();
    }

    /**
     * Discord용 응답 생성 (사용 가능한 날짜 계산 포함)
     */
    private MyScheduleResponse buildDiscordResponse(
            CalendarEventsResponse cachedEvents,
            String discordSnowflake,
            int months,
            LocalDate startDate,
            LocalDate endDate,
            Set<LocalDate> blockedDates) {
        
        // 한국어 날짜 형식 변환 (DateFormatService의 범위 고려 파싱 사용)
        String koreanDateFormat = cachedEvents.toKoreanDateFormat();
        Set<LocalDate> busyDates = dateFormatService.parseKoreanDates(koreanDateFormat, startDate, endDate);

        // 사용 가능한 날짜 계산
        Set<LocalDate> allDatesInRange = generateDateRange(startDate, endDate);
        Set<LocalDate> availableDates = allDatesInRange.stream()
                .filter(date -> !busyDates.contains(date))        // iCal 일정 제외
                .filter(date -> !blockedDates.contains(date))     // 웹 차단 날짜 제외
                .collect(Collectors.toSet());

        String availableDatesFormat = dateFormatService.formatDatesToKorean(availableDates);
        double availabilityRatio = allDatesInRange.isEmpty() ? 0.0 : 
                (double) availableDates.size() / allDatesInRange.size();

        return MyScheduleResponse.builder()
                .discordSnowflake(discordSnowflake)
                .koreanDateFormat(koreanDateFormat)
                .availableDatesFormat(availableDatesFormat)
                .totalEvents(cachedEvents.getStatistics().getTotalEvents())
                .totalAvailableDays(availableDates.size())
                .totalBlockedDays(blockedDates.size())
                .availabilityRatio(Math.round(availabilityRatio * 10000.0) / 10000.0)
                .requestedMonths(months)
                .calendarCount(cachedEvents.getStatistics().getTotalCalendars())
                .syncedAt(cachedEvents.getStatistics().getLastSyncedAt())
                .isWebUserRegistered(true)
                .hasICalCalendars(cachedEvents.getStatistics().getTotalCalendars() > 0)
                .build();
    }

    /**
     * 날짜 범위 생성 유틸리티
     */
    private Set<LocalDate> generateDateRange(LocalDate startDate, LocalDate endDate) {
        return startDate.datesUntil(endDate)
                .collect(Collectors.toSet());
    }
}