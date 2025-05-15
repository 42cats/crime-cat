package com.crimecat.backend.notification.dto.response;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.domain.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 알림 응답 DTO (간소화됨)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    
    /**
     * static factory method
     */
    public static NotificationDto from(Notification notification) {
        return NotificationDto.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .status(notification.getStatus())
            .createdAt(notification.getCreatedAt())
            .expiresAt(notification.getExpiresAt())
            .build();
    }
}
