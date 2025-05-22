package com.crimecat.backend.notification.dto.response;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.domain.Notification;
import com.fasterxml.jackson.annotation.JsonRawValue;
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
    
    // Sender 정보 (시스템 알림인 경우 null)
    private UUID senderId;
    private String senderName;
    
    // 메타데이터 (JSON 원본 그대로 포함)
    private String metadata;
    
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
            .senderId(notification.getSenderId())
            .senderName(notification.getSender() != null ? notification.getSender().getName() : null)
            .metadata(notification.getDataJson())
            .build();
    }
}
