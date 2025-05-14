package com.crimecat.backend.notification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 알림 목록 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListDto {
    private List<NotificationDto> notifications;
    private long unreadCount;
    
    public static NotificationListDto from(List<NotificationDto> notifications, long unreadCount) {
        return NotificationListDto.builder()
            .notifications(notifications)
            .unreadCount(unreadCount)
            .build();
    }
}
