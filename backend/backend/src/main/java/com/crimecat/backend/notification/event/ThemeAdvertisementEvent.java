package com.crimecat.backend.notification.event;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.notification.enums.NotificationType;
import lombok.Getter;

import java.util.UUID;

/**
 * 테마 광고 관련 알림 이벤트
 */
@Getter
public class ThemeAdvertisementEvent extends NotificationEvent {
    
    private final UUID userId;
    private final String themeName;
    private final NotificationType notificationType;
    private final ThemeAdvertisementRequest.ThemeType themeType;
    private final Integer refundAmount;
    private final String additionalMessage;
    
    public ThemeAdvertisementEvent(UUID userId, String themeName, 
                                 NotificationType notificationType,
                                 ThemeAdvertisementRequest.ThemeType themeType,
                                 Integer refundAmount,
                                 String additionalMessage) {
        this.userId = userId;
        this.themeName = themeName;
        this.notificationType = notificationType;
        this.themeType = themeType;
        this.refundAmount = refundAmount;
        this.additionalMessage = additionalMessage;
    }
    
    public ThemeAdvertisementEvent(UUID userId, String themeName, 
                                 NotificationType notificationType,
                                 ThemeAdvertisementRequest.ThemeType themeType) {
        this(userId, themeName, notificationType, themeType, null, null);
    }
}