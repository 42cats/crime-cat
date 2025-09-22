package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarEventsResponse;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 개인 캘린더 서비스
 * - 표준 레이어 아키텍처 준수
 * - 단일 책임 원칙 적용
 * - Spring Cache 통합
 * - ErrorStatus 기반 예외 처리
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PersonalCalendarService {

    private final MultipleCalendarService multipleCalendarService;
    private final UnifiedCalendarCacheService unifiedCacheService;
    private final OptimizedBlockedDateService blockedDateService;
    private final CacheManager caffeineCacheManager;

    // =================================================================================
    // 캘린더 관리 API
    // =================================================================================

    /**
     * 사용자의 등록된 캘린더 목록 조회
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.USER_CALENDARS, key = "#userId")
    public List<CalendarResponse> getUserCalendars(UUID userId) {
        try {
            log.info("📅 [PERSONAL] 캘린더 목록 조회: userId={}", userId);
            return multipleCalendarService.getUserCalendars(userId, true);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 목록 조회 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.INTERNAL_ERROR.asServiceException();
        }
    }

    /**
     * 새 캘린더 추가
     */
    @Transactional
    @CacheEvict(value = {CacheType.UNIFIED_CALENDAR_EVENTS, CacheType.USER_CALENDARS}, allEntries = true)
    public CalendarResponse addCalendar(UUID userId, CalendarCreateRequest request) {
        try {
            log.info("📅 [PERSONAL] 캘린더 추가: userId={}, url={}", userId, request.getIcalUrl());
            return multipleCalendarService.addCalendar(userId, request);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 추가 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.CALENDAR_ADD_FAILED.asServiceException();
        }
    }

    /**
     * 캘린더 수정
     */
    @Transactional
    @CacheEvict(value = {CacheType.UNIFIED_CALENDAR_EVENTS, CacheType.USER_CALENDARS}, allEntries = true)
    public CalendarResponse updateCalendar(UUID userId, UUID calendarId, CalendarUpdateRequest request) {
        try {
            log.info("📅 [PERSONAL] 캘린더 수정: userId={}, calendarId={}", userId, calendarId);
            return multipleCalendarService.updateCalendar(calendarId, request, userId);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 수정 실패: userId={}, calendarId={}, error={}", 
                    userId, calendarId, e.getMessage());
            throw ErrorStatus.CALENDAR_UPDATE_FAILED.asServiceException();
        }
    }

    /**
     * 캘린더 삭제
     */
    @Transactional
    @CacheEvict(value = {CacheType.UNIFIED_CALENDAR_EVENTS, CacheType.USER_CALENDARS}, allEntries = true)
    public void deleteCalendar(UUID userId, UUID calendarId) {
        try {
            log.info("📅 [PERSONAL] 캘린더 삭제: userId={}, calendarId={}", userId, calendarId);
            multipleCalendarService.deleteCalendar(calendarId, userId);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 삭제 실패: userId={}, calendarId={}, error={}", 
                    userId, calendarId, e.getMessage());
            throw ErrorStatus.CALENDAR_DELETE_FAILED.asServiceException();
        }
    }

    /**
     * 개별 캘린더 동기화
     */
    @Transactional
    public CalendarResponse syncCalendar(UUID userId, UUID calendarId) {
        try {
            log.info("📅 [PERSONAL] 캘린더 동기화: userId={}, calendarId={}", userId, calendarId);
            
            CalendarResponse result = multipleCalendarService.syncCalendar(calendarId, userId);
            
            // 순차적 캐시 무효화 (순서 중요)
            log.info("🗑️ [CACHE_ORDER] Step 1 - Spring Cache 무효화");
            if (caffeineCacheManager.getCache("user-calendars") != null) {
                caffeineCacheManager.getCache(CacheType.USER_CALENDARS).evict(userId);
            }
            if (caffeineCacheManager.getCache("unified:calendar:events") != null) {
                caffeineCacheManager.getCache(CacheType.UNIFIED_CALENDAR_EVENTS).clear();
            }
            
            log.info("🗑️ [CACHE_ORDER] Step 2 - UnifiedCalendarCacheService Redis 캐시 무효화");
            unifiedCacheService.invalidateUserCache(userId);
            
            log.info("✅ [CACHE_COMPLETE] 모든 캐시 레이어 무효화 완료");
            
            return result;
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 동기화 실패: userId={}, calendarId={}, error={}", 
                    userId, calendarId, e.getMessage());
            throw ErrorStatus.CALENDAR_SYNC_FAILED.asServiceException();
        }
    }

    /**
     * 전체 캘린더 동기화 (동기화만 수행, 목록 조회는 별도 API)
     */
    @Transactional
    public Map<String, Object> syncAllCalendars(UUID userId, Map<String, Object> request) {
        try {
            log.info("📅 [PERSONAL] 전체 캘린더 동기화: userId={}", userId);
            
            // 동기화만 수행 (목록 조회 제외)
            multipleCalendarService.syncAllUserCalendars(userId);
            
            // 순차적 캐시 무효화 (순서 중요)
            log.info("🗑️ [CACHE_ORDER] Step 1 - Spring Cache 전체 무효화");
            if (caffeineCacheManager.getCache("user-calendars") != null) {
                caffeineCacheManager.getCache(CacheType.USER_CALENDARS).clear();
            }
            if (caffeineCacheManager.getCache("unified:calendar:events") != null) {
                caffeineCacheManager.getCache(CacheType.UNIFIED_CALENDAR_EVENTS).clear();
            }
            
            log.info("🗑️ [CACHE_ORDER] Step 2 - UnifiedCalendarCacheService Redis 캐시 무효화");
            unifiedCacheService.invalidateUserCache(userId);
            
            log.info("✅ [CACHE_COMPLETE] 모든 캐시 레이어 무효화 완료");
            
            return Map.of(
                "success", true,
                "message", "전체 캘린더 동기화가 완료되었습니다. 목록을 새로고침해주세요."
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 전체 캘린더 동기화 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.CALENDAR_SYNC_ALL_FAILED.asServiceException();
        }
    }

    // =================================================================================
    // 캘린더 이벤트 조회 API
    // =================================================================================

    /**
     * 캐시된 캘린더 이벤트 조회 (UnifiedCacheService 캐시 활용)
     */
    @Transactional
    public CalendarEventsResponse getCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        try {
            log.info("📅 [PERSONAL] 캘린더 이벤트 조회: userId={}, range={} ~ {} (UnifiedCache 활용)", userId, startDate, endDate);
            return unifiedCacheService.getCachedCalendarEvents(userId, startDate, endDate);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 이벤트 조회 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.CALENDAR_EVENTS_LOAD_FAILED.asServiceException();
        }
    }

    /**
     * 캘린더 이벤트 강제 새로고침 (UnifiedCacheService 캐시 무효화)
     */
    @Transactional
    public CalendarEventsResponse refreshCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        try {
            log.info("📅 [PERSONAL] 캘린더 이벤트 강제 새로고침: userId={}, range={} ~ {}", userId, startDate, endDate);
            return unifiedCacheService.forceRefreshCalendarEvents(userId, startDate, endDate);
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 이벤트 강제 새로고침 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.CALENDAR_EVENTS_REFRESH_FAILED.asServiceException();
        }
    }

    // =================================================================================
    // 날짜 차단 관리 API
    // =================================================================================

    /**
     * 특정 날짜 차단
     */
    @Transactional
    public Map<String, Object> blockDate(UUID userId, LocalDate date) {
        try {
            log.info("📅 [PERSONAL] 날짜 차단: userId={}, date={}", userId, date);
            blockedDateService.blockDate(userId, date);
            return Map.of(
                "success", true,
                "message", "날짜가 차단되었습니다",
                "userId", userId,
                "date", date
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 차단 실패: userId={}, date={}, error={}", userId, date, e.getMessage());
            throw ErrorStatus.DATE_BLOCK_FAILED.asServiceException();
        }
    }

    /**
     * 특정 날짜 차단 해제
     */
    @Transactional
    public Map<String, Object> unblockDate(UUID userId, LocalDate date) {
        try {
            log.info("📅 [PERSONAL] 날짜 차단 해제: userId={}, date={}", userId, date);
            blockedDateService.unblockDate(userId, date);
            return Map.of(
                "success", true,
                "message", "날짜 차단이 해제되었습니다",
                "userId", userId,
                "date", date
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 차단 해제 실패: userId={}, date={}, error={}", userId, date, e.getMessage());
            throw ErrorStatus.DATE_UNBLOCK_FAILED.asServiceException();
        }
    }

    /**
     * 날짜 범위 차단
     */
    @Transactional
    public Map<String, Object> blockDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        try {
            log.info("📅 [PERSONAL] 날짜 범위 차단: userId={}, range={} ~ {}", userId, startDate, endDate);
            blockedDateService.blockDateRange(userId, startDate, endDate);
            return Map.of(
                "success", true,
                "message", "날짜 범위가 차단되었습니다",
                "userId", userId,
                "startDate", startDate,
                "endDate", endDate
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 범위 차단 실패: userId={}, range={} ~ {}, error={}", 
                    userId, startDate, endDate, e.getMessage());
            throw ErrorStatus.DATE_RANGE_BLOCK_FAILED.asServiceException();
        }
    }

    /**
     * 날짜 범위 차단 해제
     */
    @Transactional
    public Map<String, Object> unblockDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        try {
            log.info("📅 [PERSONAL] 날짜 범위 차단 해제: userId={}, range={} ~ {}", userId, startDate, endDate);
            blockedDateService.unblockDateRange(userId, startDate, endDate);
            return Map.of(
                "success", true,
                "message", "날짜 범위 차단이 해제되었습니다",
                "userId", userId,
                "startDate", startDate,
                "endDate", endDate
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 범위 차단 해제 실패: userId={}, range={} ~ {}, error={}", 
                    userId, startDate, endDate, e.getMessage());
            throw ErrorStatus.DATE_RANGE_UNBLOCK_FAILED.asServiceException();
        }
    }

    /**
     * 차단된 날짜 목록 조회
     */
    @Transactional(readOnly = true)
    public List<String> getBlockedDates(UUID userId, LocalDate startDate, LocalDate endDate) {
        try {
            log.info("📅 [PERSONAL] 차단 날짜 목록 조회: userId={}, range={} ~ {}", userId, startDate, endDate);
            Set<LocalDate> blockedDates = blockedDateService.getUserBlockedDatesInRange(userId, startDate, endDate);
            return blockedDates.stream()
                    .map(LocalDate::toString)
                    .sorted()
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 차단 날짜 목록 조회 실패: userId={}, range={} ~ {}, error={}", 
                    userId, startDate, endDate, e.getMessage());
            throw ErrorStatus.BLOCKED_DATES_LOAD_FAILED.asServiceException();
        }
    }

    // =================================================================================
    // 캐시 관리 API
    // =================================================================================

    /**
     * 사용자 캘린더 캐시 무효화
     */
    @Transactional
    @CacheEvict(value = {CacheType.UNIFIED_CALENDAR_EVENTS, CacheType.USER_CALENDARS}, allEntries = true)
    public Map<String, Object> invalidateUserCache(UUID userId) {
        try {
            log.info("📅 [PERSONAL] 캐시 무효화: userId={}", userId);
            unifiedCacheService.invalidateUserCache(userId);
            return Map.of(
                "success", true,
                "message", "캐시가 무효화되었습니다",
                "userId", userId
            );
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캐시 무효화 실패: userId={}, error={}", userId, e.getMessage());
            throw ErrorStatus.CACHE_INVALIDATION_FAILED.asServiceException();
        }
    }
}