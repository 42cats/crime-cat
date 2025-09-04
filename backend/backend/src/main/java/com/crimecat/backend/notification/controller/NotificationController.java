package com.crimecat.backend.notification.controller;

import com.crimecat.backend.notification.dto.response.NotificationDto;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationHandlerService;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.sort.NotificationSortType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 알림 관련 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    private final NotificationHandlerService notificationHandlerService;
    
    /**
     * 알림 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) List<String> sort,
        @RequestParam(required = false) List<NotificationType> types,
        @RequestParam(required = false) List<NotificationStatus> statuses,
        @RequestParam(required = false) String keyword
    ) {
        // 🔍 [DEBUG] Controller 요청 파라미터 로깅
        log.info("🔍 [DEBUG] NotificationController.getNotifications called with:");
        log.info("🔍 [DEBUG]   - page: {}, size: {}", page, size);
        log.info("🔍 [DEBUG]   - sort: {}", sort);
        log.info("🔍 [DEBUG]   - types: {} (size: {})", types, types != null ? types.size() : "null");
        log.info("🔍 [DEBUG]   - statuses: {} (size: {})", statuses, statuses != null ? statuses.size() : "null");
        log.info("🔍 [DEBUG]   - keyword: '{}'", keyword);
        
        List<NotificationSortType> sortTypes = (sort != null && !sort.isEmpty()) ?
                sort.stream()
                        .map(String::toUpperCase)
                        .map(NotificationSortType::valueOf)
                        .toList()
                : List.of(NotificationSortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        
        log.info("🔍 [DEBUG] Resolved parameters before calling service:");
        log.info("🔍 [DEBUG]   - currentUserId: {}", currentUserId);
        log.info("🔍 [DEBUG]   - pageable: {}", pageable);
        log.info("🔍 [DEBUG]   - sortTypes: {}", sortTypes);
        log.info("🔍 [DEBUG]   - resolvedSort: {}", resolvedSort);
        
        try {
            Page<NotificationDto> notifications = notificationService.getUserNotifications(
                currentUserId, pageable, types, statuses, keyword
            );
            
            log.info("🔍 [DEBUG] Service call successful, returning {} notifications", notifications.getTotalElements());
            return ResponseEntity.ok(notifications);
            
        } catch (Exception e) {
            log.error("🚨 [DEBUG] Service call failed in controller: {}", e.getMessage());
            log.error("🚨 [DEBUG] Exception in controller:", e);
            throw e;
        }
    }
    
    /**
     * 특정 알림 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationDto> getNotification(@PathVariable UUID id) {
        NotificationDto notification = notificationService.getNotification(id);
        return ResponseEntity.ok(notification);
    }
    
    /**
     * 알림 읽음 처리
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 미읽은 알림 개수 조회
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        UUID currentUserId = AuthenticationUtil.getCurrentUser().getId();
        long count = notificationService.getUnreadCount(currentUserId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * 알림 액션 처리 (모든 타입 공통)
     * 예: POST /api/notifications/123/accept
     * 예: POST /api/notifications/456/decline
     */
    @PostMapping("/{id}/{action}")
    public ResponseEntity<Void> processAction(
        @PathVariable UUID id,
        @PathVariable String action,
        @RequestBody Object requestBody
    ) {
        notificationHandlerService.processAction(id, action, requestBody);
        return ResponseEntity.ok().build();
    }
}
