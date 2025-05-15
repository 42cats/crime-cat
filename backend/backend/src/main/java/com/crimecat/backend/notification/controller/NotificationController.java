package com.crimecat.backend.notification.controller;

import com.crimecat.backend.notification.dto.response.NotificationDto;
import com.crimecat.backend.notification.service.NotificationHandlerService;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.sort.NotificationSortType;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * 알림 관련 API 컨트롤러
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
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
        @RequestParam(required = false) List<String> sort
    ) {
        List<NotificationSortType> sortTypes = (sort != null && !sort.isEmpty()) ?
                sort.stream()
                        .map(String::toUpperCase)
                        .map(NotificationSortType::valueOf)
                        .toList()
                : List.of(NotificationSortType.LATEST);

        Sort resolvedSort = SortUtil.combineSorts(sortTypes);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserId();
        Page<NotificationDto> notifications = notificationService.getUserNotifications(currentUserId, pageable);
        
        return ResponseEntity.ok(notifications);
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
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserId();
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
