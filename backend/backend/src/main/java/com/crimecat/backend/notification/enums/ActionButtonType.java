package com.crimecat.backend.notification.enums;

/**
 * 액션 버튼 타입 열거형
 * 순수하게 비즈니스 액션 타입만 정의 (UI 스타일은 프론트엔드에서 결정)
 */
public enum ActionButtonType {
    ACCEPT("accept", "승인"),
    DECLINE("decline", "거절"),
    CONFIRM("confirm", "확인"), 
    CANCEL("cancel", "취소"),
    VIEW("view", "보기"),
    DELETE("delete", "삭제"),
    IGNORE("ignore", "무시"),
    APPROVE("approve", "승낙"),
    REJECT("reject", "거부");
    
    private final String value;
    private final String defaultLabel;
    
    ActionButtonType(String value, String defaultLabel) {
        this.value = value;
        this.defaultLabel = defaultLabel;
    }
    
    public String getValue() {
        return value;
    }
    
    public String getDefaultLabel() {
        return defaultLabel;
    }
}