package com.crimecat.backend.notification.enums;

/**
 * 알림 타입을 정의하는 열거형
 */
public enum NotificationType {
    GAME_NOTICE("게임 알림"),
    COMMENT_ALERT("댓글 알림"),
    SYSTEM_NOTICE("시스템 알림"),
    NEW_THEME("새 테마"),
    GAME_RECORD_REQUEST("게임 기록 등록 요청");
    
    private final String displayName;
    
    NotificationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
