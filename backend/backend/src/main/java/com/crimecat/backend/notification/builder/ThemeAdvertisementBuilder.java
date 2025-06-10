package com.crimecat.backend.notification.builder;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.event.ThemeAdvertisementEvent;

import java.util.UUID;

/**
 * 테마 광고 알림 빌더
 */
public class ThemeAdvertisementBuilder extends NotificationBuilder<ThemeAdvertisementEvent> {
    
    public ThemeAdvertisementBuilder() {
        super(ThemeAdvertisementEvent.class);
    }
    
    @Override
    public Notification buildNotification(ThemeAdvertisementEvent event) {
        String title = buildTitle(event);
        String message = buildMessage(event);
        String iconUrl = buildIconUrl(event.getThemeType());
        
        return Notification.builder()
                .receiverId(event.getUserId())
                .type(event.getNotificationType())
                .title(title)
                .message(message)
                .iconUrl(iconUrl)
                .build();
    }
    
    private String buildTitle(ThemeAdvertisementEvent event) {
        return switch (event.getNotificationType()) {
            case THEME_AD_EXPIRED -> "테마 광고 만료";
            case THEME_AD_ACTIVATED -> "테마 광고 활성화";
            case THEME_AD_CANCELLED -> "테마 광고 취소";
            default -> "테마 광고 알림";
        };
    }
    
    private String buildMessage(ThemeAdvertisementEvent event) {
        String themeTypeDisplay = getThemeTypeDisplay(event.getThemeType());
        
        return switch (event.getNotificationType()) {
            case THEME_AD_EXPIRED -> String.format("'%s' %s 테마의 광고가 만료되었습니다.", 
                    event.getThemeName(), themeTypeDisplay);
            case THEME_AD_ACTIVATED -> String.format("'%s' %s 테마의 광고가 활성화되었습니다!", 
                    event.getThemeName(), themeTypeDisplay);
            case THEME_AD_CANCELLED -> {
                if (event.getRefundAmount() != null && event.getRefundAmount() > 0) {
                    yield String.format("'%s' %s 테마의 광고가 취소되었습니다. %d포인트가 환불되었습니다.", 
                            event.getThemeName(), themeTypeDisplay, event.getRefundAmount());
                } else {
                    yield String.format("'%s' %s 테마의 광고가 취소되었습니다.", 
                            event.getThemeName(), themeTypeDisplay);
                }
            }
            default -> String.format("'%s' %s 테마 광고에 대한 알림이 있습니다.", 
                    event.getThemeName(), themeTypeDisplay);
        };
    }
    
    private String buildIconUrl(ThemeAdvertisementRequest.ThemeType themeType) {
        return switch (themeType) {
            case CRIMESCENE -> "/content/image/default_crime_scene_image.png";
            case ESCAPE_ROOM -> "/content/image/default_escape_room_image.png";
            case MURDER_MYSTERY -> "/content/image/default_image.png";
            case REALWORLD -> "/content/image/default_image.png";
        };
    }
    
    private String getThemeTypeDisplay(ThemeAdvertisementRequest.ThemeType themeType) {
        return switch (themeType) {
            case CRIMESCENE -> "범죄현장";
            case ESCAPE_ROOM -> "방탈출";
            case MURDER_MYSTERY -> "머더미스터리";
            case REALWORLD -> "리얼월드";
        };
    }
}