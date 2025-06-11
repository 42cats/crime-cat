package com.crimecat.backend.notification.builder;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

/**
 * 테마 광고 알림 빌더
 */
public class ThemeAdvertisementBuilder extends NotificationBuilder<ThemeAdvertisementBuilder> {
    
    private String themeName;
    private ThemeAdvertisementRequest.ThemeType themeType;
    private Integer refundAmount;
    private String reason;
    
    public ThemeAdvertisementBuilder(NotificationService notificationService, TemplateService templateService, NotificationType type) {
        super(notificationService, templateService, type);
    }
    
    /**
     * 테마명 설정
     */
    public ThemeAdvertisementBuilder themeName(String themeName) {
        this.themeName = themeName;
        return this;
    }
    
    /**
     * 테마 타입 설정
     */
    public ThemeAdvertisementBuilder themeType(ThemeAdvertisementRequest.ThemeType themeType) {
        this.themeType = themeType;
        return this;
    }
    
    /**
     * 환불 금액 설정
     */
    public ThemeAdvertisementBuilder refundAmount(Integer refundAmount) {
        this.refundAmount = refundAmount;
        return this;
    }
    
    /**
     * 사유 설정
     */
    public ThemeAdvertisementBuilder reason(String reason) {
        this.reason = reason;
        return this;
    }
    
    @Override
    protected void prepareNotification() {
        // 데이터 필드에 광고 관련 정보 추가
        data("themeName", themeName);
        data("themeType", themeType != null ? themeType.name() : null);
        
        if (refundAmount != null) {
            data("refundAmount", refundAmount);
        }
        
        if (reason != null) {
            data("reason", reason);
        }
        
        // 타입별 제목과 메시지 설정
        if (title == null) {
            title = buildTitle();
        }
        
        if (message == null) {
            message = buildMessage();
        }
    }
    
    private String buildTitle() {
        return switch (type) {
            case THEME_AD_EXPIRED -> "테마 광고 만료";
            case THEME_AD_ACTIVATED -> "테마 광고 활성화";
            case THEME_AD_CANCELLED -> "테마 광고 취소";
            default -> "테마 광고 알림";
        };
    }
    
    private String buildMessage() {
        String themeTypeDisplay = getThemeTypeDisplay(themeType);
        
        return switch (type) {
            case THEME_AD_EXPIRED -> String.format("'%s' %s 테마의 광고가 만료되었습니다.", 
                    themeName, themeTypeDisplay);
            case THEME_AD_ACTIVATED -> String.format("'%s' %s 테마의 광고가 활성화되었습니다!", 
                    themeName, themeTypeDisplay);
            case THEME_AD_CANCELLED -> {
                if (refundAmount != null && refundAmount > 0) {
                    yield String.format("'%s' %s 테마의 광고가 취소되었습니다. %d포인트가 환불되었습니다.", 
                            themeName, themeTypeDisplay, refundAmount);
                } else {
                    yield String.format("'%s' %s 테마의 광고가 취소되었습니다.", 
                            themeName, themeTypeDisplay);
                }
            }
            default -> String.format("'%s' %s 테마 광고에 대한 알림이 있습니다.", 
                    themeName, themeTypeDisplay);
        };
    }
    
    private String getThemeTypeDisplay(ThemeAdvertisementRequest.ThemeType themeType) {
        if (themeType == null) return "테마";
        
        return switch (themeType) {
            case CRIMESCENE -> "크라임씬";
            case ESCAPE_ROOM -> "방탈출";
            case MURDER_MYSTERY -> "머더미스터리";
            case REALWORLD -> "리얼월드";
        };
    }
}