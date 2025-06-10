package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.notification.event.ThemeAdvertisementEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * 테마 광고 관련 알림 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeAdvertisementNotificationService {
    
    private final NotificationEventPublisher eventPublisher;
    
    /**
     * 광고 만료 알림 발송
     */
    public void sendAdvertisementExpiredNotification(ThemeAdvertisementRequest request) {
        try {
            ThemeAdvertisementEvent event = new ThemeAdvertisementEvent(
                request.getUserId(),
                request.getThemeName(),
                NotificationType.THEME_AD_EXPIRED,
                request.getThemeType()
            );
            
            eventPublisher.publishEvent(event);
            log.info("광고 만료 알림 발송: userId={}, themeName={}", 
                request.getUserId(), request.getThemeName());
            
        } catch (Exception e) {
            log.error("광고 만료 알림 발송 실패: userId={}, themeName={}", 
                request.getUserId(), request.getThemeName(), e);
        }
    }
    
    /**
     * 광고 활성화 알림 발송
     */
    public void sendAdvertisementActivatedNotification(ThemeAdvertisementRequest request) {
        try {
            ThemeAdvertisementEvent event = new ThemeAdvertisementEvent(
                request.getUserId(),
                request.getThemeName(),
                NotificationType.THEME_AD_ACTIVATED,
                request.getThemeType()
            );
            
            eventPublisher.publishEvent(event);
            log.info("광고 활성화 알림 발송: userId={}, themeName={}", 
                request.getUserId(), request.getThemeName());
            
        } catch (Exception e) {
            log.error("광고 활성화 알림 발송 실패: userId={}, themeName={}", 
                request.getUserId(), request.getThemeName(), e);
        }
    }
    
    /**
     * 광고 취소 알림 발송
     */
    public void sendAdvertisementCancelledNotification(ThemeAdvertisementRequest request, 
                                                      Integer refundAmount, 
                                                      String reason) {
        try {
            ThemeAdvertisementEvent event = new ThemeAdvertisementEvent(
                request.getUserId(),
                request.getThemeName(),
                NotificationType.THEME_AD_CANCELLED,
                request.getThemeType(),
                refundAmount,
                reason
            );
            
            eventPublisher.publishEvent(event);
            log.info("광고 취소 알림 발송: userId={}, themeName={}, refund={}", 
                request.getUserId(), request.getThemeName(), refundAmount);
            
        } catch (Exception e) {
            log.error("광고 취소 알림 발송 실패: userId={}, themeName={}", 
                request.getUserId(), request.getThemeName(), e);
        }
    }
}