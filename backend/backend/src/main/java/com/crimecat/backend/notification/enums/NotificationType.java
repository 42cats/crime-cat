package com.crimecat.backend.notification.enums;

/**
 * 알림 타입을 정의하는 열거형
 */
public enum NotificationType {
    GAME_NOTICE("게임 알림"),
    COMMENT_ALERT("댓글 알림"),
    SYSTEM_NOTICE("시스템 알림"),
    NEW_THEME("새 테마"),
    GAME_RECORD_REQUEST("게임 기록 등록 요청"),
    USER_POST_NEW("새 게시글"),
    USER_POST_COMMENT("게시글 댓글"),
    USER_POST_COMMENT_REPLY("댓글 답글"),
    THEME_POINT_REWARD("테마 작성 포인트"),
    THEME_AD_EXPIRED("테마 광고 만료"),
    THEME_AD_ACTIVATED("테마 광고 활성화"),
    THEME_AD_CANCELLED("테마 광고 취소");
    
    private final String displayName;
    
    NotificationType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
