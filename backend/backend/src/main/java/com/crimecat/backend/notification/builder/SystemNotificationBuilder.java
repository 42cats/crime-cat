package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

/**
 * 시스템 알림을 위한 전용 빌더
 * 제네릭을 사용하여 타입 안전성 확보
 */
public class SystemNotificationBuilder extends NotificationBuilder<SystemNotificationBuilder> {
    
    public SystemNotificationBuilder(NotificationService notificationService, TemplateService templateService) {
        super(notificationService, templateService, NotificationType.SYSTEM_NOTICE);
    }
    
    /**
     * 긴급 알림 설정 (체이닝)
     */
    public SystemNotificationBuilder urgent() {
        return data("priority", "HIGH")
               .data("urgent", true);
    }
    
    /**
     * 일반 알림 설정 (체이닝)
     */
    public SystemNotificationBuilder normal() {
        return data("priority", "NORMAL")
               .data("urgent", false);
    }
    
    /**
     * 알림 카테고리 설정 (체이닝)
     */
    public SystemNotificationBuilder category(String category) {
        return data("category", category);
    }
    
    /**
     * 알림 준비 - 시스템 알림 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 데이터 설정
        data("notificationType", "SYSTEM_NOTICE");
        data("isSystemNotification", true);
        
        // 우선순위가 설정되지 않은 경우 기본값
        if (!data.containsKey("priority")) {
            data("priority", "NORMAL");
        }
    }
}
