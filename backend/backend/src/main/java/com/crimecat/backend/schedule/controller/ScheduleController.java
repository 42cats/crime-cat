package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.domain.EventStatus;
import com.crimecat.backend.schedule.dto.EventCreateRequest;
import com.crimecat.backend.schedule.dto.EventResponse;
import com.crimecat.backend.schedule.dto.UserCalendarRequest;
import com.crimecat.backend.schedule.dto.response.DualRecommendationResponse;
import com.crimecat.backend.schedule.service.EventLeaveService;
import com.crimecat.backend.schedule.service.EventStatusService;
import com.crimecat.backend.schedule.service.OptimizedBlockedDateService;
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
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedule")
@RequiredArgsConstructor
@Slf4j
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final OptimizedBlockedDateService blockedDateService;
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

    @PostMapping("/my-calendar")
    public ResponseEntity<?> saveUserCalendar(@RequestBody UserCalendarRequest request,
                                              @AuthenticationPrincipal WebUser currentUser) {
        scheduleService.saveUserCalendar(request, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/events/{eventId}/availability")
    public ResponseEntity<List<LocalDateTime[]>> getAvailability(@PathVariable UUID eventId) {
        return ResponseEntity.ok(scheduleService.calculateAvailability(eventId));
    }

    // =================================================================================
    // 개인 달력 비활성 날짜 관리 엔드포인트
    // =================================================================================

    /**
     * 특정 날짜 비활성화 (추천에서 제외)
     */
    @PostMapping("/my-calendar/block-date")
    public ResponseEntity<?> blockDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                       @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_BLOCK] POST /my-calendar/block-date user={} date={}", currentUser.getId(), date);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId()); // 본인 데이터 확인
            log.debug("🌐 [API_BLOCK] Authentication validated for user={}", currentUser.getId());
            
            blockedDateService.blockDate(currentUser.getId(), date);
            
            Map<String, Object> response = Map.of("message", "날짜가 비활성화되었습니다", "date", date);
            log.info("🌐 [API_BLOCK] Successfully blocked date {} for user {}, response={}", date, currentUser.getId(), response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("🌐 [API_BLOCK] Failed to block date {} for user {}: {}", date, currentUser.getId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 특정 날짜 활성화 (추천에 포함)
     */
    @DeleteMapping("/my-calendar/block-date")
    public ResponseEntity<?> unblockDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                         @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_UNBLOCK] DELETE /my-calendar/block-date user={} date={}", currentUser.getId(), date);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            log.debug("🌐 [API_UNBLOCK] Authentication validated for user={}", currentUser.getId());
            
            blockedDateService.unblockDate(currentUser.getId(), date);
            
            Map<String, Object> response = Map.of("message", "날짜가 활성화되었습니다", "date", date);
            log.info("🌐 [API_UNBLOCK] Successfully unblocked date {} for user {}, response={}", date, currentUser.getId(), response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("🌐 [API_UNBLOCK] Failed to unblock date {} for user {}: {}", date, currentUser.getId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 날짜 범위 일괄 비활성화 (드래그 선택)
     */
    @PostMapping("/my-calendar/block-range")
    public ResponseEntity<?> blockDateRange(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                            @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_BLOCK_RANGE] POST /my-calendar/block-range user={} startDate={} endDate={}", 
            currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            log.debug("🌐 [API_BLOCK_RANGE] Authentication validated for user={}", currentUser.getId());
            
            blockedDateService.blockDateRange(currentUser.getId(), startDate, endDate);
            
            Map<String, Object> response = Map.of("message", "날짜 범위가 비활성화되었습니다", 
                                               "startDate", startDate, "endDate", endDate);
            log.info("🌐 [API_BLOCK_RANGE] Successfully blocked range {} to {} for user {}, response={}", 
                startDate, endDate, currentUser.getId(), response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("🌐 [API_BLOCK_RANGE] Failed to block range {} to {} for user {}: {}", 
                startDate, endDate, currentUser.getId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 날짜 범위 일괄 활성화 (드래그 선택)
     */
    @PostMapping("/my-calendar/unblock-range")
    public ResponseEntity<?> unblockDateRange(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                              @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_UNBLOCK_RANGE] POST /my-calendar/unblock-range user={} startDate={} endDate={}", 
            currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            log.debug("🌐 [API_UNBLOCK_RANGE] Authentication validated for user={}", currentUser.getId());
            
            blockedDateService.unblockDateRange(currentUser.getId(), startDate, endDate);
            
            Map<String, Object> response = Map.of("message", "날짜 범위가 활성화되었습니다", 
                                               "startDate", startDate, "endDate", endDate);
            log.info("🌐 [API_UNBLOCK_RANGE] Successfully unblocked range {} to {} for user {}, response={}", 
                startDate, endDate, currentUser.getId(), response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("🌐 [API_UNBLOCK_RANGE] Failed to unblock range {} to {} for user {}: {}", 
                startDate, endDate, currentUser.getId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 비활성화된 날짜 목록 조회
     */
    @GetMapping("/my-calendar/blocked-dates")
    public ResponseEntity<Set<LocalDate>> getBlockedDates(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                                         @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_GET_BLOCKED] GET /my-calendar/blocked-dates user={} startDate={} endDate={}", 
            currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            log.debug("🌐 [API_GET_BLOCKED] Authentication validated for user={}", currentUser.getId());
            
            Set<LocalDate> blockedDates = blockedDateService.getUserBlockedDatesInRange(currentUser.getId(), startDate, endDate);
            
            log.info("🌐 [API_GET_BLOCKED] Successfully retrieved {} blocked dates for user {} in range {} to {}", 
                blockedDates.size(), currentUser.getId(), startDate, endDate);
            log.debug("🌐 [API_GET_BLOCKED] Blocked dates: {}", blockedDates);
            
            return ResponseEntity.ok(blockedDates);
        } catch (Exception e) {
            log.error("🌐 [API_GET_BLOCKED] Failed to get blocked dates for user {} in range {} to {}: {}", 
                currentUser.getId(), startDate, endDate, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 사용자 iCalendar 이벤트 조회 (특정 기간)
     */
    @GetMapping("/my-calendar/events-in-range")
    public ResponseEntity<List<Map<String, Object>>> getUserEventsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {
        log.info("🌐 [API_GET_EVENTS] GET /my-calendar/events-in-range user={} startDate={} endDate={}", 
            currentUser.getId(), startDate, endDate);
        
        try {
            AuthenticationUtil.validateCalendarAccess(currentUser.getId());
            log.debug("🌐 [API_GET_EVENTS] Authentication validated for user={}", currentUser.getId());
            
            List<Map<String, Object>> rawEvents = scheduleService.getUserEventsInRange(currentUser.getId(), startDate, endDate);
            log.info("🔍 [MAP_DEBUG] Raw events count from service: {}", rawEvents.size());
            
            List<Map<String, Object>> events = rawEvents
                .stream()
                .map(event -> {
                    // 🔍 Map 구조 디버깅 로그
                    log.debug("🔍 [MAP_DEBUG] Event map keys: {}", event.keySet());
                    log.debug("🔍 [MAP_DEBUG] Event map values: {}", event);
                    
                    // 각 키의 존재 여부와 값 확인
                    log.debug("🔍 [MAP_DEBUG] 'id' key exists: {}, value: {}", 
                        event.containsKey("id"), event.get("id"));
                    log.debug("🔍 [MAP_DEBUG] 'title' key exists: {}, value: {}", 
                        event.containsKey("title"), event.get("title"));
                    log.debug("🔍 [MAP_DEBUG] 'Title' key exists: {}, value: {}", 
                        event.containsKey("Title"), event.get("Title"));
                    log.debug("🔍 [MAP_DEBUG] 'startTime' key exists: {}, value: {}", 
                        event.containsKey("startTime"), event.get("startTime"));
                    log.debug("🔍 [MAP_DEBUG] 'StartTime' key exists: {}, value: {}", 
                        event.containsKey("StartTime"), event.get("StartTime"));
                    log.debug("🔍 [MAP_DEBUG] 'endTime' key exists: {}, value: {}", 
                        event.containsKey("endTime"), event.get("endTime"));
                    log.debug("🔍 [MAP_DEBUG] 'EndTime' key exists: {}, value: {}", 
                        event.containsKey("EndTime"), event.get("EndTime"));
                    
                    Map<String, Object> eventMap = new java.util.HashMap<>();
                    eventMap.put("id", event.get("id").toString());
                    eventMap.put("title", event.get("title"));
                    eventMap.put("startTime", event.get("startTime").toString());
                    eventMap.put("endTime", event.get("endTime").toString());
                    eventMap.put("allDay", false); // iCalendar 이벤트는 시간이 지정되어 있음
                    return eventMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            log.info("🌐 [API_GET_EVENTS] Successfully retrieved {} events for user {} in range {} to {}", 
                events.size(), currentUser.getId(), startDate, endDate);
            log.debug("🌐 [API_GET_EVENTS] Events: {}", events);
            
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
