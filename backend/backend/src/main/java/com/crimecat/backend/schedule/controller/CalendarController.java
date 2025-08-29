package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import com.crimecat.backend.schedule.service.CalendarColorManager;
import com.crimecat.backend.schedule.service.MultipleCalendarService;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 다중 캘린더 관리 컨트롤러 (DEPRECATED)
 * @deprecated PersonalCalendarController로 통합됨
 */
@Deprecated
@ConditionalOnProperty(name = "calendar.controller.legacy.enabled", havingValue = "true", matchIfMissing = false)
@RestController
@RequestMapping("/api/v1/my-calendar-legacy")  // 경로 변경으로 충돌 방지
@RequiredArgsConstructor
@Slf4j
public class CalendarController {

    private final MultipleCalendarService multipleCalendarService;

    /**
     * 사용자의 등록된 캘린더 목록 조회
     */
    @GetMapping("/calendars")
    public ResponseEntity<List<CalendarResponse>> getUserCalendars(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        
        List<CalendarResponse> response = multipleCalendarService.getUserCalendars(currentUser.getId(), activeOnly);
        return ResponseEntity.ok(response);
    }

    /**
     * 새 캘린더 추가
     */
    @PostMapping("/calendars")
    public ResponseEntity<CalendarResponse> addCalendar(
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal WebUser currentUser) {

        CalendarResponse response = multipleCalendarService.addCalendar(currentUser.getId(), request);
        log.info("Successfully added calendar for user {}: {}", currentUser.getId(), response.getId());
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

        CalendarResponse response = multipleCalendarService.updateCalendar(calendarId, request, currentUser.getId());
        log.info("Successfully updated calendar {}", calendarId);
        return ResponseEntity.ok(response);
    }

    /**
     * 캘린더 삭제
     */
    @DeleteMapping("/calendars/{calendarId}")
    public ResponseEntity<Void> deleteCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        multipleCalendarService.deleteCalendar(calendarId, currentUser.getId());
        log.info("Successfully deleted calendar {}", calendarId);
        return ResponseEntity.ok().build();
    }

    /**
     * 수동 동기화
     */
    @PostMapping("/calendars/{calendarId}/sync")
    public ResponseEntity<CalendarResponse> syncCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [CONTROLLER_SYNC] Sync request for calendar: {} by user: {}", calendarId, currentUser.getId());
        
        CalendarResponse response = multipleCalendarService.syncCalendar(calendarId, currentUser.getId());
        
        log.info("✅ [SYNC_COMPLETE] Successfully synced calendar {} | Response status: {}", 
            calendarId, response.getSyncStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * 모든 캘린더 일괄 동기화
     */
    @PostMapping("/calendars/sync-all")
    public ResponseEntity<List<CalendarResponse>> syncAllCalendars(
            @AuthenticationPrincipal WebUser currentUser) {

        List<CalendarResponse> response = multipleCalendarService.syncAllCalendarsAndGet(currentUser.getId());
        log.info("Successfully synced all calendars for user {}", currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용 가능한 색상 팔레트 조회
     */
    @GetMapping("/color-palette")
    public ResponseEntity<CalendarColorManager.ColorInfo[]> getColorPalette() {
        CalendarColorManager.ColorInfo[] colors = multipleCalendarService.getColorPalette();
        return ResponseEntity.ok(colors);
    }

    // ✅ [DEPRECATED] 
    // 중복 API 제거: /events-in-range -> PersonalCalendarController로 통합됨
    // PersonalCalendarController.getGroupedEvents() 사용
    
    /**
     * @deprecated PersonalCalendarController.getGroupedEvents() 사용
     */
//    @Deprecated
//    @GetMapping("/events-in-range")
//    public ResponseEntity<Map<String, MultipleCalendarService.CalendarGroup>> getGroupedEvents(
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
//            @AuthenticationPrincipal WebUser currentUser) {
//
//        log.warn("⚠️ [DEPRECATED] Using deprecated API /events-in-range. Use PersonalCalendarController.getGroupedEvents() instead.");
//        Map<String, MultipleCalendarService.CalendarGroup> groups = 
//            multipleCalendarService.getGroupedCalendarEvents(currentUser.getId(), startDate, endDate);
//
//        return ResponseEntity.ok(groups);
//    }
}