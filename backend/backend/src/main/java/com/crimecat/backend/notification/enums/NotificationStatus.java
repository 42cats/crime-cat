package com.crimecat.backend.notification.enums;

/**
 * 알림 상태를 정의하는 열거형
 */
public enum NotificationStatus {
    UNREAD("미읽음"),
    READ("읽음"),
    PROCESSED("처리됨");
    
    private final String displayName;
    
    NotificationStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
