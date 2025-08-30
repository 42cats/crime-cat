package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarEventsResponse;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import com.crimecat.backend.schedule.service.CalendarColorManager;
import com.crimecat.backend.schedule.service.PersonalCalendarService;
import com.crimecat.backend.schedule.service.MultipleCalendarService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 통합 개인 캘린더 관리 컨트롤러
 * - CalendarController + ScheduleController의 my-calendar 기능 통합
 * - 통합 캐싱 시스템 적용
 * - 중복 API 제거 및 일관된 응답 형식 제공
 */
@RestController
@RequestMapping("/api/v1/my-calendar")
@RequiredArgsConstructor
@Slf4j
public class PersonalCalendarController {

    private final PersonalCalendarService personalCalendarService;
    private final CalendarColorManager colorManager;

    // =================================================================================
    // 캘린더 관리 API (기존 CalendarController에서 이전)
    // =================================================================================

    /**
     * 사용자의 등록된 캘린더 목록 조회
     */
    @GetMapping("/calendars")
    public ResponseEntity<List<CalendarResponse>> getUserCalendars(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        
        log.info("📋 [PERSONAL] 캘린더 목록 조회: userId={}, activeOnly={}", currentUser.getId(), activeOnly);
        List<CalendarResponse> response = personalCalendarService.getUserCalendars(currentUser.getId());
        log.info("✅ [PERSONAL] 캘린더 목록 조회 완료: {} 개 캘린더", response.size());
        return ResponseEntity.ok(response);
    }

    /**
     * 새 캘린더 추가
     */
    @PostMapping("/calendars")
    public ResponseEntity<CalendarResponse> addCalendar(
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("➕ [PERSONAL] 캘린더 추가 요청: userId={}, url={}", 
                currentUser.getId(), request.getIcalUrl());
        
        CalendarResponse response = personalCalendarService.addCalendar(currentUser.getId(), request);
        
        log.info("✅ [PERSONAL] 캘린더 추가 완료: calendarId={}", response.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 캘린더 설정 수정
     */
    @PutMapping("/calendars/{calendarId}")
    public ResponseEntity<CalendarResponse> updateCalendar(
            @PathVariable UUID calendarId,
            @Valid @RequestBody CalendarUpdateRequest request,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("✏️ [PERSONAL] 캘린더 수정 요청: calendarId={}, userId={}", calendarId, currentUser.getId());
        
        CalendarResponse response = personalCalendarService.updateCalendar(currentUser.getId(), calendarId, request);
        
        log.info("✅ [PERSONAL] 캘린더 수정 완료: calendarId={}", calendarId);
        return ResponseEntity.ok(response);
    }

    /**
     * 캘린더 삭제
     */
    @DeleteMapping("/calendars/{calendarId}")
    public ResponseEntity<Void> deleteCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🗑️ [PERSONAL] 캘린더 삭제 요청: calendarId={}, userId={}", calendarId, currentUser.getId());
        
        personalCalendarService.deleteCalendar(currentUser.getId(), calendarId);
        
        log.info("✅ [PERSONAL] 캘린더 삭제 완료: calendarId={}", calendarId);
        return ResponseEntity.ok().build();
    }

    /**
     * 개별 캘린더 수동 동기화
     */
    @PostMapping("/calendars/{calendarId}/sync")
    public ResponseEntity<CalendarResponse> syncCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [PERSONAL] 캘린더 동기화 요청: calendarId={}, userId={}", calendarId, currentUser.getId());
        
        CalendarResponse response = personalCalendarService.syncCalendar(currentUser.getId(), calendarId);
        
        log.info("✅ [PERSONAL] 캘린더 동기화 완료: calendarId={}, status={}", 
                calendarId, response.getSyncStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * 모든 캘린더 일괄 동기화
     */
    @PostMapping("/calendars/sync-all")
    public ResponseEntity<List<CalendarResponse>> syncAllCalendars(
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [PERSONAL] 전체 캘린더 동기화 요청: userId={}", currentUser.getId());
        
        Map<String, Object> syncResult = personalCalendarService.syncAllCalendars(currentUser.getId(), Map.of());
        @SuppressWarnings("unchecked")
        List<CalendarResponse> response = (List<CalendarResponse>) syncResult.get("calendars");
        
        log.info("✅ [PERSONAL] 전체 캘린더 동기화 완료: {} 개 캘린더", response.size());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용 가능한 색상 팔레트 조회
     */
    @GetMapping("/color-palette")
    public ResponseEntity<CalendarColorManager.ColorInfo[]> getColorPalette() {
        CalendarColorManager.ColorInfo[] colors = colorManager.getAllColors();
        return ResponseEntity.ok(colors);
    }

    /**
     * 개별 캘린더 상태 변경 (활성화/비활성화)
     */
    @PatchMapping("/calendars/{calendarId}/status")
    public ResponseEntity<CalendarResponse> toggleCalendarStatus(
            @PathVariable UUID calendarId,
            @RequestBody Map<String, Boolean> request,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [PERSONAL] 캘린더 상태 변경 요청: calendarId={}, userId={}, isActive={}", 
                calendarId, currentUser.getId(), request.get("isActive"));
        
        Boolean isActive = request.get("isActive");
        if (isActive == null) {
            throw new IllegalArgumentException("isActive 값이 필요합니다");
        }
        
        // For now, get existing calendar data to preserve other settings
        List<CalendarResponse> calendars = personalCalendarService.getUserCalendars(currentUser.getId());
        CalendarResponse existingCalendar = calendars.stream()
                .filter(cal -> cal.getId().equals(calendarId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Calendar not found"));
        
        CalendarUpdateRequest updateRequest = new CalendarUpdateRequest();
        updateRequest.setDisplayName(existingCalendar.getDisplayName());
        updateRequest.setColorIndex(existingCalendar.getColorIndex());
        updateRequest.setIsActive(isActive);
        CalendarResponse response = personalCalendarService.updateCalendar(currentUser.getId(), calendarId, updateRequest);
        
        log.info("✅ [PERSONAL] 캘린더 상태 변경 완료: calendarId={}, newStatus={}", 
                calendarId, response.getIsActive());
        return ResponseEntity.ok(response);
    }

    /**
     * 캘린더 순서 변경
     */
    @PutMapping("/calendars/reorder")
    public ResponseEntity<List<CalendarResponse>> updateCalendarOrder(
            @RequestBody Map<String, List<Map<String, Object>>> request,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [PERSONAL] 캘린더 순서 변경 요청: userId={}", currentUser.getId());
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> calendars = request.get("calendars");
        if (calendars == null || calendars.isEmpty()) {
            throw new IllegalArgumentException("calendars 배열이 필요합니다");
        }
        
        // Personal service doesn't have updateCalendarOrder - would need to implement or delegate
        List<CalendarResponse> response = personalCalendarService.getUserCalendars(currentUser.getId());
        
        log.info("✅ [PERSONAL] 캘린더 순서 변경 요청 (현재 미구현): {} 개 캘린더", response.size());
        return ResponseEntity.ok(response);
    }

    // =================================================================================
    // 캘린더 이벤트 조회 API (통합 캐싱 적용)
    // =================================================================================

    /**
     * 통합 캘린더 이벤트 조회 (캐싱 적용)
     * - 기존 CalendarController와 ScheduleController의 중복 API 통합
     * - 30분 캐싱 + 강제 새로고침 지원
     */
    @GetMapping("/events-in-range")
    public ResponseEntity<Map<String, MultipleCalendarService.CalendarGroup>> getCalendarEventsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("📅 [PERSONAL] 캘린더 이벤트 조회: userId={}, range={} ~ {}", 
                currentUser.getId(), startDate, endDate);

        try {
            // 🚀 Personal Calendar Service 사용
            CalendarEventsResponse cachedEvents = personalCalendarService.getCalendarEvents(
                    currentUser.getId(), startDate, endDate);

            // 웹 API 형식으로 응답
            Map<String, MultipleCalendarService.CalendarGroup> response = cachedEvents.toWebResponse();

            log.info("✅ [PERSONAL] 캘린더 이벤트 조회 완료: {} 개 캘린더, {} 개 이벤트", 
                    response.size(), cachedEvents.getStatistics().getTotalEvents());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 이벤트 조회 실패: userId={}, error={}", 
                    currentUser.getId(), e.getMessage(), e);
            
            // 빈 응답 반환으로 에러 방지 (프론트엔드 호환성)
            Map<String, MultipleCalendarService.CalendarGroup> emptyResponse = new HashMap<>();
            return ResponseEntity.ok(emptyResponse);
        }
    }

    /**
     * 캘린더 이벤트 강제 새로고침
     * - 30분 이내에도 즉시 캐시 갱신
     */
    @PostMapping("/events-in-range/refresh")
    public ResponseEntity<Map<String, MultipleCalendarService.CalendarGroup>> forceRefreshCalendarEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [PERSONAL] 캘린더 이벤트 강제 새로고침: userId={}, range={} ~ {}", 
                currentUser.getId(), startDate, endDate);

        try {
            // 🚀 Personal Calendar Service의 강제 새로고침 사용
            CalendarEventsResponse refreshedEvents = personalCalendarService.refreshCalendarEvents(
                    currentUser.getId(), startDate, endDate);

            // 웹 API 형식으로 응답
            Map<String, MultipleCalendarService.CalendarGroup> response = refreshedEvents.toWebResponse();

            log.info("✅ [PERSONAL] 캘린더 이벤트 강제 새로고침 완료: {} 개 캘린더, {} 개 이벤트", 
                    response.size(), refreshedEvents.getStatistics().getTotalEvents());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캘린더 이벤트 강제 새로고침 실패: userId={}, error={}", 
                    currentUser.getId(), e.getMessage(), e);
            
            // 빈 응답 반환으로 에러 방지 (프론트엔드 호환성)
            Map<String, MultipleCalendarService.CalendarGroup> emptyResponse = new HashMap<>();
            return ResponseEntity.ok(emptyResponse);
        }
    }

    // =================================================================================
    // 개인 달력 비활성 날짜 관리 API (기존 ScheduleController에서 이전)
    // =================================================================================

    /**
     * 특정 날짜 비활성화 (추천에서 제외)
     */
    @PostMapping("/block-date")
    public ResponseEntity<Map<String, Object>> blockDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("🚫 [PERSONAL] 날짜 차단 요청: userId={}, date={}", currentUser.getId(), date);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            Map<String, Object> response = personalCalendarService.blockDate(currentUser.getId(), date);
            
            log.info("✅ [PERSONAL] 날짜 차단 완료: userId={}, date={}", currentUser.getId(), date);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 차단 실패: userId={}, date={}, error={}", 
                    currentUser.getId(), date, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 특정 날짜 활성화 (추천에 포함)
     */
    @DeleteMapping("/block-date")
    public ResponseEntity<Map<String, Object>> unblockDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("✅ [PERSONAL] 날짜 차단 해제 요청: userId={}, date={}", currentUser.getId(), date);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            Map<String, Object> response = personalCalendarService.unblockDate(currentUser.getId(), date);
            
            log.info("✅ [PERSONAL] 날짜 차단 해제 완료: userId={}, date={}", currentUser.getId(), date);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 차단 해제 실패: userId={}, date={}, error={}", 
                    currentUser.getId(), date, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 날짜 범위 일괄 비활성화 (드래그 선택)
     */
    @PostMapping("/block-range")
    public ResponseEntity<Map<String, Object>> blockDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("🚫 [PERSONAL] 날짜 범위 차단 요청: userId={}, range={} ~ {}", 
                currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            Map<String, Object> response = personalCalendarService.blockDateRange(currentUser.getId(), startDate, endDate);
            
            log.info("✅ [PERSONAL] 날짜 범위 차단 완료: userId={}, range={} ~ {}", 
                    currentUser.getId(), startDate, endDate);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 범위 차단 실패: userId={}, range={} ~ {}, error={}", 
                    currentUser.getId(), startDate, endDate, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 날짜 범위 일괄 활성화 (드래그 선택)
     */
    @PostMapping("/unblock-range")
    public ResponseEntity<Map<String, Object>> unblockDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("✅ [PERSONAL] 날짜 범위 차단 해제 요청: userId={}, range={} ~ {}", 
                currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            Map<String, Object> response = personalCalendarService.unblockDateRange(currentUser.getId(), startDate, endDate);
            
            log.info("✅ [PERSONAL] 날짜 범위 차단 해제 완료: userId={}, range={} ~ {}", 
                    currentUser.getId(), startDate, endDate);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 날짜 범위 차단 해제 실패: userId={}, range={} ~ {}, error={}", 
                    currentUser.getId(), startDate, endDate, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 비활성화된 날짜 목록 조회
     */
    @GetMapping("/blocked-dates")
    public ResponseEntity<Set<LocalDate>> getBlockedDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("📋 [PERSONAL] 차단 날짜 목록 조회: userId={}, range={} ~ {}", 
                currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            List<String> blockedDateStrings = personalCalendarService.getBlockedDates(currentUser.getId(), startDate, endDate);
            Set<LocalDate> blockedDates = blockedDateStrings.stream()
                    .map(LocalDate::parse)
                    .collect(java.util.stream.Collectors.toSet());
            
            log.info("✅ [PERSONAL] 차단 날짜 목록 조회 완료: userId={}, {} 개 날짜", 
                    currentUser.getId(), blockedDates.size());
            
            return ResponseEntity.ok(blockedDates);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 차단 날짜 목록 조회 실패: userId={}, range={} ~ {}, error={}", 
                    currentUser.getId(), startDate, endDate, e.getMessage(), e);
            throw e;
        }
    }

    // =================================================================================
    // 캐시 관리 API
    // =================================================================================

    /**
     * 사용자 캐시 전체 무효화
     */
    @PostMapping("/cache/invalidate")
    public ResponseEntity<Map<String, Object>> invalidateCache(
            @AuthenticationPrincipal WebUser currentUser) {
        
        log.info("🗑️ [PERSONAL] 캐시 무효화 요청: userId={}", currentUser.getId());
        
        try {
            Map<String, Object> response = personalCalendarService.invalidateUserCache(currentUser.getId());
            
            log.info("✅ [PERSONAL] 캐시 무효화 완료: userId={}", currentUser.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ [PERSONAL] 캐시 무효화 실패: userId={}, error={}", 
                    currentUser.getId(), e.getMessage(), e);
            throw e;
        }
    }
}