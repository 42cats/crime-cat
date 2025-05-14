package com.crimecat.backend.notification.enums;

/**
 * 폼 필드 타입 열거형
 */
public enum FormFieldType {
    TEXT("text", "텍스트 입력"),
    SELECT("select", "선택 목록"),
    DATE("date", "날짜 입력"),
    HIDDEN("hidden", "숨겨진 필드"),
    TEXTAREA("textarea", "텍스트 영역"),
    NUMBER("number", "숫자 입력"),
    EMAIL("email", "이메일 입력");
    
    private final String value;
    private final String description;
    
    FormFieldType(String value, String description) {
        this.value = value;
        this.description = description;
    }
    
    public String getValue() {
        return value;
    }
    
    public String getDescription() {
        return description;
    }
}