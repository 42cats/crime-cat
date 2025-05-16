package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;

/**
 * 시스템 알림을 위한 전용 빌더
 */
public class SystemNotificationBuilder extends NotificationBuilder {
    
    public SystemNotificationBuilder(NotificationService notificationService) {
        super(notificationService, NotificationType.SYSTEM_NOTICE);
    }
    
    /**
     * 긴급 알림 설정 (체이닝)
     */
    public SystemNotificationBuilder urgent() {
        data("priority", "HIGH");
        return this;
    }
    
    /**
     * 일반 알림 설정 (체이닝)
     */
    public SystemNotificationBuilder normal() {
        data("priority", "NORMAL");
        return this;
    }
    
    /**
     * 알림 카테고리 설정 (체이닝)
     */
    public SystemNotificationBuilder category(String category) {
        data("category", category);
        return this;
    }
    
    /**
     * 알림 준비 - 시스템 알림 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 제목 설정
        if (title == null) {
            title = "시스템 알림";
        }
        
        // 기본 메시지 설정
        if (message == null) {
            message = "시스템에서 중요한 알림이 있습니다.";
        }
        
        // 필수 데이터 설정
        data("notificationType", "SYSTEM_NOTICE");
        data("isSystemNotification", true);
        
        // 우선순위가 설정되지 않은 경우 기본값
        if (!data.containsKey("priority")) {
            data("priority", "NORMAL");
        }
    }
}
