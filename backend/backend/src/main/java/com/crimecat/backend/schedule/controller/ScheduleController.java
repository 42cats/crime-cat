package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.dto.EventCreateRequest;
import com.crimecat.backend.schedule.dto.EventResponse;
import com.crimecat.backend.schedule.dto.UserCalendarRequest;
import com.crimecat.backend.schedule.dto.response.DualRecommendationResponse;
import com.crimecat.backend.schedule.service.EventLeaveService;
import com.crimecat.backend.schedule.service.EventStatusService;
import com.crimecat.backend.schedule.service.OptimizedRecommendationService;
import com.crimecat.backend.schedule.service.ScheduleService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedule")
@RequiredArgsConstructor
@Slf4j
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final EventLeaveService eventLeaveService;
    private final OptimizedRecommendationService recommendationService;
    private final EventStatusService eventStatusService;

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody EventCreateRequest request,
                                           @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.createEvent(request, currentUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/events/{eventId}/join")
    public ResponseEntity<?> joinEvent(@PathVariable UUID eventId,
                                       @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.joinEvent(eventId, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents(@RequestParam(required = false) String category,
                                                         @RequestParam(required = false) EventStatus status) {
        return ResponseEntity.ok(scheduleService.getEvents(category, status));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.getEvent(eventId));
    }

    // ✅ [DEPRECATED]
    // 중복 API 제거: /my-calendar -> PersonalCalendarController.addCalendar() 사용
    
    /**
     * @deprecated PersonalCalendarController.addCalendar() 사용
     */
    @Deprecated
    @PostMapping("/my-calendar")
    public ResponseEntity<?> saveUserCalendar(@RequestBody UserCalendarRequest request,
                                              @AuthenticationPrincipal WebUser currentUser) {
        log.warn("⚠️ [DEPRECATED] Using deprecated API /my-calendar. Use PersonalCalendarController.addCalendar() instead.");
        scheduleService.saveUserCalendar(request, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events/{eventId}/availability")
    public ResponseEntity<List<LocalDateTime[]>> getAvailability(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.calculateAvailability(eventId));
    }

    // =================================================================================
    // ❌ REMOVED: 개인 달력 비활성 날짜 관리 엔드포인트
    // PersonalCalendarController에 동일한 기능이 구현되어 중복 제거
    // - POST /my-calendar/block-date -> PersonalCalendarController.blockDate()
    // - DELETE /my-calendar/block-date -> PersonalCalendarController.unblockDate()
    // - POST /my-calendar/block-range -> PersonalCalendarController.blockDateRange()
    // - POST /my-calendar/unblock-range -> PersonalCalendarController.unblockDateRange()
    // - GET /my-calendar/blocked-dates -> PersonalCalendarController.getBlockedDates()
    // =================================================================================

    // ✅ [DEPRECATED]
    // 중복 API 제거: /my-calendar/events-in-range -> PersonalCalendarController.getGroupedEvents() 사용
    
    /**
     * @deprecated PersonalCalendarController.getGroupedEvents() 사용
     */
    @Deprecated
    @GetMapping("/my-calendar/events-in-range")
    public ResponseEntity<List<Map<String, Object>>> getUserEventsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {
        log.warn("⚠️ [DEPRECATED] Using deprecated API /my-calendar/events-in-range. Use PersonalCalendarController.getGroupedEvents() instead.");
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            
            List<Map<String, Object>> rawEvents = scheduleService.getUserEventsInRange(currentUser.getId(), startDate, endDate);
            
            List<Map<String, Object>> events = rawEvents
                .stream()
                .map(event -> {
                    Map<String, Object> eventMap = new java.util.HashMap<>();
                    eventMap.put("id", event.get("id").toString());
                    eventMap.put("title", event.get("title"));
                    eventMap.put("startTime", event.get("startTime").toString());
                    eventMap.put("endTime", event.get("endTime").toString());
                    eventMap.put("allDay", false);
                    return eventMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("🌐 [API_GET_EVENTS] Failed to get events for user {} in range {} to {}: {}", 
                currentUser.getId(), startDate, endDate, e.getMessage(), e);
            throw e;
        }
    }

    // =================================================================================
    // 이벤트 나가기/재참여 엔드포인트
    // =================================================================================

    /**
     * 이벤트 나가기
     */
    @PostMapping("/events/{eventId}/leave")
    public ResponseEntity<EventLeaveService.LeaveResult> leaveEvent(@PathVariable UUID eventId,
                                                                   @AuthenticationPrincipal WebUser currentUser) {
        EventLeaveService.LeaveResult result = eventLeaveService.leaveEvent(eventId, currentUser.getId());
        return ResponseEntity.ok(result);
    }

    /**
     * 이벤트 재참여 (나갔던 사용자가 다시 참여)
     */
    @PostMapping("/events/{eventId}/rejoin")
    public ResponseEntity<EventLeaveService.RejoinResult> rejoinEvent(@PathVariable UUID eventId,
                                                                     @AuthenticationPrincipal WebUser currentUser) {
        EventLeaveService.RejoinResult result = eventLeaveService.rejoinEvent(eventId, currentUser.getId());
        return ResponseEntity.ok(result);
    }

    /**
     * 이벤트 나간 사용자 목록 조회 (생성자 또는 MANAGER 이상)
     */
    @GetMapping("/events/{eventId}/leavers")
    public ResponseEntity<?> getEventLeavers(@PathVariable UUID eventId) {
        var eventEntity = scheduleService.getEventEntity(eventId);
        AuthenticationUtil.validateEventParticipantsAccess(eventEntity.getCreator().getId());
        
        var leavers = eventLeaveService.getEventLeavers(eventId);
        return ResponseEntity.ok(Map.of("leavers", leavers, "count", leavers.size()));
    }

    // =================================================================================
    // 이중 추천 시스템 엔드포인트
    // =================================================================================

    /**
     * 이중 추천 시스템 ("현재 참여자" vs "나를 포함한" 추천)
     */
    @GetMapping("/events/{eventId}/dual-recommendations")
    public ResponseEntity<DualRecommendationResponse> getDualRecommendations(@PathVariable UUID eventId,
                                                                            @AuthenticationPrincipal WebUser currentUser) {
        DualRecommendationResponse response = recommendationService.getDualRecommendations(eventId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * 추천 통계 조회
     */
    @GetMapping("/events/{eventId}/recommendation-stats")
    public ResponseEntity<Map<String, Object>> getRecommendationStats(@PathVariable UUID eventId) {
        Map<String, Object> stats = recommendationService.getRecommendationStatistics(eventId);
        return ResponseEntity.ok(stats);
    }

    // =================================================================================
    // 이벤트 상태 관리 엔드포인트 (관리자용)
    // =================================================================================

    /**
     * 이벤트 수동 완료 처리 (MANAGER 이상 권한 필요)
     */
    @PostMapping("/events/{eventId}/complete")
    public ResponseEntity<?> completeEvent(@PathVariable UUID eventId) {
        AuthenticationUtil.validateEventAdminAccess(); // MANAGER 이상 권한 체크
        var eventEntity = scheduleService.getEventEntity(eventId);
        var newStatus = eventStatusService.completeEvent(eventEntity);
        return ResponseEntity.ok(Map.of("message", "이벤트가 완료되었습니다", "newStatus", newStatus));
    }

    /**
     * 이벤트 수동 취소 처리 (MANAGER 이상 권한 필요)
     */
    @PostMapping("/events/{eventId}/cancel")
    public ResponseEntity<?> cancelEvent(@PathVariable UUID eventId,
                                        @RequestParam(required = false) String reason) {
        AuthenticationUtil.validateEventAdminAccess(); // MANAGER 이상 권한 체크
        var eventEntity = scheduleService.getEventEntity(eventId);
        var newStatus = eventStatusService.cancelEvent(
            eventEntity,
            reason != null ? reason : "관리자에 의한 취소"
        );
        return ResponseEntity.ok(Map.of("message", "이벤트가 취소되었습니다", "newStatus", newStatus, "reason", reason));
    }
}
