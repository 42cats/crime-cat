package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.UUID;

/**
 * 시스템 알림 이벤트
 * 시스템에서 사용자에게 보내는 공지사항, 업데이트 정보 등
 */
@Getter
public class SystemNotificationEvent extends NotificationEvent {
    
    // 알림 카테고리
    private final String category;
    
    // 우선순위
    private final Priority priority;
    
    // 시스템 알림 타입
    private final SystemNotificationType systemType;
    
    public enum Priority {
        LOW, NORMAL, HIGH, URGENT
    }
    
    public enum SystemNotificationType {
        MAINTENANCE,    // 점검 안내
        UPDATE,         // 업데이트 정보
        SECURITY,       // 보안 관련
        FEATURE,        // 새 기능 안내
        EVENT,          // 이벤트 안내
        GENERAL         // 일반 공지
    }
    
    public SystemNotificationEvent(Object source, UUID receiverId, String title, String message,
                                   String category, Priority priority, SystemNotificationType systemType) {
        super(source, receiverId, null); // 시스템 알림은 발신자가 없음
        this.category = category;
        this.priority = priority;
        this.systemType = systemType;
        
        this.withTitle(title)
            .withMessage(message)
            .withData("category", category)
            .withData("priority", priority.toString())
            .withData("systemType", systemType.toString())
            .withData("isSystemNotification", true);
    }
    
    /**
     * 일반 시스템 알림 팩토리 메서드
     */
    public static SystemNotificationEvent general(Object source, UUID receiverId, String title, String message) {
        return new SystemNotificationEvent(source, receiverId, title, message, 
                                         "general", Priority.NORMAL, SystemNotificationType.GENERAL);
    }
    
    /**
     * 긴급 시스템 알림 팩토리 메서드
     */
    public static SystemNotificationEvent urgent(Object source, UUID receiverId, String title, String message) {
        return new SystemNotificationEvent(source, receiverId, title, message, 
                                         "urgent", Priority.URGENT, SystemNotificationType.SECURITY);
    }
    
    /**
     * 점검 안내 팩토리 메서드
     */
    public static SystemNotificationEvent maintenance(Object source, UUID receiverId, String message) {
        return new SystemNotificationEvent(source, receiverId, "시스템 점검 안내", message, 
                                         "maintenance", Priority.HIGH, SystemNotificationType.MAINTENANCE);
    }
    
    /**
     * 업데이트 안내 팩토리 메서드
     */
    public static SystemNotificationEvent update(Object source, UUID receiverId, String title, String message) {
        return new SystemNotificationEvent(source, receiverId, title, message, 
                                         "update", Priority.NORMAL, SystemNotificationType.UPDATE);
    }
}
