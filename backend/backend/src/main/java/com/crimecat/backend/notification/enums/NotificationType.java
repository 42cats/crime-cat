package com.crimecat.backend.notification.enums;

/**
 * 알림 타입을 정의하는 열거형
 */
public enum NotificationType {
    RECORD_REQUEST("기록 요청"),
    FRIEND_REQUEST("친구 요청"),
    GAME_NOTICE("게임 알림"),
    COMMENT_ALERT("댓글 알림"),
    SYSTEM_NOTICE("시스템 알림"),
    NEW_THEME("새 테마");
    
    private final String displayName;
    
    NotificationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
