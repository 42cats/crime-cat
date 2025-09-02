package com.crimecat.backend.schedule.facade;

import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarEventsResponse;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import com.crimecat.backend.schedule.service.CalendarColorManager;
import com.crimecat.backend.schedule.service.PersonalCalendarService;
import com.crimecat.backend.schedule.service.MultipleCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;

/**
 * Personal Calendar Facade - 비즈니스 로직 조합 및 캐싱 관리
 * 
 * 권장방안 적용:
 * - Facade는 트랜잭션 없이 Service들의 조합만 담당
 * - 각 Service는 독립적인 @Transactional 경계 유지
 * - 캐싱 로직은 Facade 레벨에서 관리
 * - 복잡한 비즈니스 로직 조합 (상태변경, 순서변경 등)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PersonalCalendarFacade {

    private final PersonalCalendarService personalCalendarService;
    private final CalendarColorManager colorManager;

    // =================================================================================
    // 캘린더 관리 Facade 메서드
    // =================================================================================

    /**
     * 사용자 캘린더 목록 조회 (캐싱 적용)
     */
    @Cacheable(value = "personal_calendars", key = "#userId", unless = "#result == null")
    public List<CalendarResponse> getUserCalendars(UUID userId) {
        log.debug("🔍 [FACADE] 캘린더 목록 조회: userId={}", userId);
        return personalCalendarService.getUserCalendars(userId);
    }

    /**
     * 캘린더 추가 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public CalendarResponse addCalendar(UUID userId, CalendarCreateRequest request) {
        log.debug("➕ [FACADE] 캘린더 추가: userId={}", userId);
        return personalCalendarService.addCalendar(userId, request);
    }

    /**
     * 캘린더 수정 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public CalendarResponse updateCalendar(UUID userId, UUID calendarId, CalendarUpdateRequest request) {
        log.debug("✏️ [FACADE] 캘린더 수정: userId={}, calendarId={}", userId, calendarId);
        return personalCalendarService.updateCalendar(userId, calendarId, request);
    }

    /**
     * 캘린더 삭제 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public void deleteCalendar(UUID userId, UUID calendarId) {
        log.debug("🗑️ [FACADE] 캘린더 삭제: userId={}, calendarId={}", userId, calendarId);
        personalCalendarService.deleteCalendar(userId, calendarId);
    }

    /**
     * 캘린더 동기화 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public CalendarResponse syncCalendar(UUID userId, UUID calendarId) {
        log.debug("🔄 [FACADE] 캘린더 동기화: userId={}, calendarId={}", userId, calendarId);
        return personalCalendarService.syncCalendar(userId, calendarId);
    }

    /**
     * 전체 캘린더 동기화 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public SyncAllResult syncAllCalendars(UUID userId) {
        log.debug("🔄 [FACADE] 전체 캘린더 동기화: userId={}", userId);
        
        // 1. 동기화 수행
        Map<String, Object> syncResult = personalCalendarService.syncAllCalendars(userId, Map.of());
        
        // 2. 업데이트된 캘린더 목록 조회
        List<CalendarResponse> updatedCalendars = personalCalendarService.getUserCalendars(userId);
        
        return new SyncAllResult(syncResult, updatedCalendars);
    }

    /**
     * 색상 팔레트 조회 (캐싱 적용)
     */
    @Cacheable(value = "color_palette", unless = "#result == null")
    public CalendarColorManager.ColorInfo[] getColorPalette() {
        log.debug("🎨 [FACADE] 색상 팔레트 조회");
        return colorManager.getAllColors();
    }

    /**
     * 캘린더 상태 변경 (활성화/비활성화)
     * - 복잡한 비즈니스 로직: 기존 데이터 조회 → 업데이트 → 캐시 무효화
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public CalendarStatusChangeResult toggleCalendarStatus(UUID userId, UUID calendarId, Boolean isActive) {
        log.debug("🔄 [FACADE] 캘린더 상태 변경: userId={}, calendarId={}, isActive={}", 
                userId, calendarId, isActive);

        // 1. 기존 캘린더 정보 조회 (독립 트랜잭션)
        List<CalendarResponse> calendars = personalCalendarService.getUserCalendars(userId);
        CalendarResponse existingCalendar = calendars.stream()
                .filter(cal -> cal.getId().equals(calendarId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Calendar not found: " + calendarId));

        // 2. 업데이트 요청 구성
        CalendarUpdateRequest updateRequest = new CalendarUpdateRequest();
        updateRequest.setDisplayName(existingCalendar.getDisplayName());
        updateRequest.setColorIndex(existingCalendar.getColorIndex());
        updateRequest.setIsActive(isActive);

        // 3. 업데이트 수행 (독립 트랜잭션)
        CalendarResponse updatedCalendar = personalCalendarService.updateCalendar(userId, calendarId, updateRequest);

        return new CalendarStatusChangeResult(existingCalendar.getIsActive(), updatedCalendar.getIsActive(), updatedCalendar);
    }

    /**
     * 캘린더 순서 변경
     * - 현재 PersonalCalendarService에 순서 변경 기능이 없어서 placeholder
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events"}, key = "#userId")
    public List<CalendarResponse> updateCalendarOrder(UUID userId, List<Map<String, Object>> calendarsOrder) {
        log.debug("🔄 [FACADE] 캘린더 순서 변경 요청: userId={}", userId);
        
        // TODO: PersonalCalendarService에 순서 변경 기능 추가 필요
        // 현재는 기존 목록 반환
        return personalCalendarService.getUserCalendars(userId);
    }

    // =================================================================================
    // 캘린더 이벤트 Facade 메서드
    // =================================================================================

    /**
     * 캘린더 이벤트 조회 (캐싱 적용)
     */
    @Cacheable(value = "personal_calendar_events", 
               key = "#userId + '_' + #startDate + '_' + #endDate",
               unless = "#result == null")
    public Map<String, MultipleCalendarService.CalendarGroup> getCalendarEventsInRange(
            UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("📅 [FACADE] 캘린더 이벤트 조회: userId={}, range={} ~ {}", userId, startDate, endDate);
        
        try {
            CalendarEventsResponse cachedEvents = personalCalendarService.getCalendarEvents(userId, startDate, endDate);
            return cachedEvents.toWebResponse();
        } catch (Exception e) {
            log.error("❌ [FACADE] 캘린더 이벤트 조회 실패: userId={}, error={}", userId, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * 캘린더 이벤트 강제 새로고침 (캐시 무효화)
     */
    @CacheEvict(value = "personal_calendar_events", key = "#userId + '_' + #startDate + '_' + #endDate")
    public Map<String, MultipleCalendarService.CalendarGroup> forceRefreshCalendarEvents(
            UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("🔄 [FACADE] 캘린더 이벤트 강제 새로고침: userId={}, range={} ~ {}", userId, startDate, endDate);
        
        try {
            CalendarEventsResponse refreshedEvents = personalCalendarService.refreshCalendarEvents(userId, startDate, endDate);
            return refreshedEvents.toWebResponse();
        } catch (Exception e) {
            log.error("❌ [FACADE] 캘린더 이벤트 강제 새로고침 실패: userId={}, error={}", userId, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    // =================================================================================
    // 날짜 차단 관리 Facade 메서드
    // =================================================================================

    /**
     * 날짜 차단 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_blocked_dates", "personal_calendar_events"}, 
                allEntries = true, 
                condition = "#userId != null")
    public Map<String, Object> blockDate(UUID userId, LocalDate date) {
        log.debug("🚫 [FACADE] 날짜 차단: userId={}, date={}", userId, date);
        return personalCalendarService.blockDate(userId, date);
    }

    /**
     * 날짜 차단 해제 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_blocked_dates", "personal_calendar_events"}, 
                allEntries = true, 
                condition = "#userId != null")
    public Map<String, Object> unblockDate(UUID userId, LocalDate date) {
        log.debug("✅ [FACADE] 날짜 차단 해제: userId={}, date={}", userId, date);
        return personalCalendarService.unblockDate(userId, date);
    }

    /**
     * 날짜 범위 차단 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_blocked_dates", "personal_calendar_events"}, 
                allEntries = true, 
                condition = "#userId != null")
    public Map<String, Object> blockDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("🚫 [FACADE] 날짜 범위 차단: userId={}, range={} ~ {}", userId, startDate, endDate);
        return personalCalendarService.blockDateRange(userId, startDate, endDate);
    }

    /**
     * 날짜 범위 차단 해제 (캐시 무효화)
     */
    @CacheEvict(value = {"personal_blocked_dates", "personal_calendar_events"}, 
                allEntries = true, 
                condition = "#userId != null")
    public Map<String, Object> unblockDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("✅ [FACADE] 날짜 범위 차단 해제: userId={}, range={} ~ {}", userId, startDate, endDate);
        return personalCalendarService.unblockDateRange(userId, startDate, endDate);
    }

    /**
     * 차단된 날짜 목록 조회 (캐싱 적용)
     */
    @Cacheable(value = "personal_blocked_dates",
               key = "#userId + '_' + #startDate + '_' + #endDate",
               unless = "#result == null")
    public Set<LocalDate> getBlockedDates(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("📋 [FACADE] 차단 날짜 목록 조회: userId={}, range={} ~ {}", userId, startDate, endDate);
        
        List<String> blockedDateStrings = personalCalendarService.getBlockedDates(userId, startDate, endDate);
        return blockedDateStrings.stream()
                .map(LocalDate::parse)
                .collect(java.util.stream.Collectors.toSet());
    }

    // =================================================================================
    // 캐시 관리 Facade 메서드
    // =================================================================================

    /**
     * 사용자 전체 캐시 무효화
     */
    @CacheEvict(value = {"personal_calendars", "personal_calendar_events", "personal_blocked_dates"}, key = "#userId")
    public Map<String, Object> invalidateUserCache(UUID userId) {
        log.debug("🗑️ [FACADE] 사용자 캐시 무효화: userId={}", userId);
        return personalCalendarService.invalidateUserCache(userId);
    }

    // =================================================================================
    // Inner Classes - Result DTOs
    // =================================================================================

    /**
     * 전체 동기화 결과
     */
    public static class SyncAllResult {
        private final Map<String, Object> syncResult;
        private final List<CalendarResponse> updatedCalendars;

        public SyncAllResult(Map<String, Object> syncResult, List<CalendarResponse> updatedCalendars) {
            this.syncResult = syncResult;
            this.updatedCalendars = updatedCalendars;
        }

        public Map<String, Object> getSyncResult() { return syncResult; }
        public List<CalendarResponse> getUpdatedCalendars() { return updatedCalendars; }
    }

    /**
     * 캘린더 상태 변경 결과
     */
    public static class CalendarStatusChangeResult {
        private final Boolean previousStatus;
        private final Boolean newStatus;
        private final CalendarResponse updatedCalendar;

        public CalendarStatusChangeResult(Boolean previousStatus, Boolean newStatus, CalendarResponse updatedCalendar) {
            this.previousStatus = previousStatus;
            this.newStatus = newStatus;
            this.updatedCalendar = updatedCalendar;
        }

        public Boolean getPreviousStatus() { return previousStatus; }
        public Boolean getNewStatus() { return newStatus; }
        public CalendarResponse getUpdatedCalendar() { return updatedCalendar; }
    }
}