package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.schedule.dto.request.CalendarCreateRequest;
import com.crimecat.backend.schedule.dto.request.CalendarUpdateRequest;
import com.crimecat.backend.schedule.dto.response.CalendarResponse;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import com.crimecat.backend.schedule.service.CalendarColorManager;
import com.crimecat.backend.schedule.service.MultipleCalendarService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 다중 캘린더 관리 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/my-calendar")
@RequiredArgsConstructor
@Slf4j
public class CalendarController {

    private final MultipleCalendarService multipleCalendarService;
    private final CalendarColorManager colorManager;
    private final UserCalendarRepository userCalendarRepository;

    /**
     * 사용자의 등록된 캘린더 목록 조회
     */
    @GetMapping("/calendars")
    public ResponseEntity<List<CalendarResponse>> getUserCalendars(
            @AuthenticationPrincipal WebUser currentUser,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        
        UUID userId = currentUser.getId();
        List<UserCalendar> calendars;
        
        if (activeOnly) {
            calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        } else {
            calendars = userCalendarRepository.findByUserIdOrderBySortOrder(userId);
        }

        List<CalendarResponse> response = calendars.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * 새 캘린더 추가
     */
    @PostMapping("/calendars")
    public ResponseEntity<CalendarResponse> addCalendar(
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal WebUser currentUser) {

        UUID userId = currentUser.getId();
        
        try {
            UserCalendar newCalendar = multipleCalendarService.addCalendar(
                userId, 
                request.getIcalUrl(), 
                request.getDisplayName()
            );
            
            // User 설정 (서비스에서 설정하지 못한 부분)
            newCalendar.setUser(currentUser);
            UserCalendar savedCalendar = userCalendarRepository.save(newCalendar);

            CalendarResponse response = convertToResponse(savedCalendar);
            
            log.info("Successfully added calendar for user {}: {}", userId, savedCalendar.getId());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Failed to add calendar for user {}: {}", userId, e.getMessage());
            throw ErrorStatus.CALENDAR_ALREADY_EXISTS.asControllerException();
        } catch (Exception e) {
            log.error("Error adding calendar for user {}: {}", userId, e.getMessage(), e);
            throw ErrorStatus.CALENDAR_SYNC_FAILED.asControllerException();
        }
    }

    /**
     * 캘린더 설정 수정
     */
    @PutMapping("/calendars/{calendarId}")
    public ResponseEntity<CalendarResponse> updateCalendar(
            @PathVariable UUID calendarId,
            @Valid @RequestBody CalendarUpdateRequest request,
            @AuthenticationPrincipal WebUser currentUser) {

        try {
            UserCalendar calendar = userCalendarRepository.findById(calendarId)
                    .orElseThrow(ErrorStatus.CALENDAR_NOT_FOUND::asServiceException);

            // 권한 체크
            if (!calendar.getUser().getId().equals(currentUser.getId())) {
                throw ErrorStatus.CALENDAR_ACCESS_DENIED.asControllerException();
            }

            // 업데이트
            if (request.getDisplayName() != null) {
                calendar.setDisplayName(request.getDisplayName());
            }
            if (request.getColorIndex() != null) {
                if (!colorManager.isValidColorIndex(request.getColorIndex())) {
                    throw ErrorStatus.CALENDAR_COLOR_INDEX_INVALID.asControllerException();
                }
                calendar.setColorIndex(request.getColorIndex());
            }
            if (request.getIsActive() != null) {
                calendar.setIsActive(request.getIsActive());
            }
            if (request.getSortOrder() != null) {
                calendar.setSortOrder(request.getSortOrder());
            }

            UserCalendar savedCalendar = userCalendarRepository.save(calendar);
            CalendarResponse response = convertToResponse(savedCalendar);

            log.info("Successfully updated calendar {}", calendarId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating calendar {}: {}", calendarId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 캘린더 삭제
     */
    @DeleteMapping("/calendars/{calendarId}")
    public ResponseEntity<Void> deleteCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        try {
            UserCalendar calendar = userCalendarRepository.findById(calendarId)
                    .orElseThrow(() -> ErrorStatus.CALENDAR_NOT_FOUND.asServiceException());

            // 권한 체크
            if (!calendar.getUser().getId().equals(currentUser.getId())) {
                throw ErrorStatus.CALENDAR_ACCESS_DENIED.asControllerException();
            }

            userCalendarRepository.delete(calendar);
            
            log.info("Successfully deleted calendar {}", calendarId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error deleting calendar {}: {}", calendarId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 수동 동기화
     */
    @PostMapping("/calendars/{calendarId}/sync")
    public ResponseEntity<CalendarResponse> syncCalendar(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal WebUser currentUser) {

        log.info("🔄 [CONTROLLER_SYNC] Sync request for calendar: {} by user: {}", calendarId, currentUser.getId());

        try {
            UserCalendar calendar = userCalendarRepository.findById(calendarId)
                    .orElseThrow(() -> ErrorStatus.CALENDAR_NOT_FOUND.asServiceException());

            log.info("📅 [CALENDAR_FOUND] Calendar found: {} | Current status: {} | Error: {}", 
                calendarId, calendar.getSyncStatus(), calendar.getSyncErrorMessage());

            // 권한 체크
            if (!calendar.getUser().getId().equals(currentUser.getId())) {
                log.error("❌ [ACCESS_DENIED] User {} cannot access calendar {}", currentUser.getId(), calendarId);
                throw ErrorStatus.CALENDAR_ACCESS_DENIED.asControllerException();
            }

            log.info("🔄 [SYNC_TRIGGER] Triggering sync for all user calendars");
            // 개별 동기화는 전체 동기화로 대체
            multipleCalendarService.syncAllUserCalendars(currentUser.getId());

            log.info("🔍 [FETCH_UPDATED] Fetching updated calendar from database");
            // 업데이트된 캘린더 조회
            UserCalendar updatedCalendar = userCalendarRepository.findById(calendarId)
                    .orElse(calendar);

            log.info("📊 [UPDATED_STATUS] Updated calendar status: {} | Error: {} | LastSync: {}", 
                updatedCalendar.getSyncStatus(), 
                updatedCalendar.getSyncErrorMessage(),
                updatedCalendar.getLastSyncedAt());

            CalendarResponse response = convertToResponse(updatedCalendar);
            
            log.info("✅ [SYNC_COMPLETE] Successfully synced calendar {} | Response status: {}", 
                calendarId, response.getSyncStatus());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ [SYNC_CONTROLLER_ERROR] Error syncing calendar {}: {}", calendarId, e.getMessage());
            log.error("📝 [ERROR_DETAILS] Exception type: {} | Stack trace: ", e.getClass().getSimpleName(), e);
            throw ErrorStatus.CALENDAR_SYNC_FAILED.asControllerException();
        }
    }

    /**
     * 모든 캘린더 일괄 동기화
     */
    @PostMapping("/calendars/sync-all")
    public ResponseEntity<List<CalendarResponse>> syncAllCalendars(
            @AuthenticationPrincipal WebUser currentUser) {

        try {
            UUID userId = currentUser.getId();
            multipleCalendarService.syncAllUserCalendars(userId);

            // 업데이트된 캘린더 목록 반환
            List<UserCalendar> calendars = userCalendarRepository.findByUserIdOrderBySortOrder(userId);
            List<CalendarResponse> response = calendars.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            log.info("Successfully synced all calendars for user {}", userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error syncing all calendars for user {}: {}", currentUser.getId(), e.getMessage(), e);
            throw ErrorStatus.CALENDAR_SYNC_FAILED.asControllerException();
        }
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
     * 캘린더별 그룹화된 이벤트 조회 (기존 API 확장)
     */
    @GetMapping("/events-in-range")
    public ResponseEntity<Map<String, MultipleCalendarService.CalendarGroup>> getGroupedEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal WebUser currentUser) {

        try {
            UUID userId = currentUser.getId();
            Map<String, MultipleCalendarService.CalendarGroup> groups = 
                multipleCalendarService.getGroupedCalendarEvents(userId, startDate, endDate);

            return ResponseEntity.ok(groups);

        } catch (Exception e) {
            log.error("Error fetching grouped events for user {}: {}", currentUser.getId(), e.getMessage(), e);
            throw ErrorStatus.CALENDAR_SYNC_FAILED.asControllerException();
        }
    }

    /**
     * UserCalendar -> CalendarResponse 변환
     */
    private CalendarResponse convertToResponse(UserCalendar calendar) {
        return CalendarResponse.builder()
                .id(calendar.getId())
                .icalUrl(calendar.getIcalUrl())
                .calendarName(calendar.getCalendarName())
                .displayName(calendar.getDisplayName())
                .colorIndex(calendar.getColorIndex())
                .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                .colorName(colorManager.getColorNameByIndex(calendar.getColorIndex()))
                .syncStatus(calendar.getSyncStatus())
                .syncErrorMessage(calendar.getSyncErrorMessage())
                .isActive(calendar.getIsActive())
                .sortOrder(calendar.getSortOrder())
                .lastSyncedAt(calendar.getLastSyncedAt())
                .createdAt(calendar.getCreatedAt())
                .updatedAt(calendar.getUpdatedAt())
                .build();
    }
}