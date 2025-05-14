package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * 폼 필드의 기본 인터페이스
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public interface FormField {
    
    /**
     * 필드 이름 (HTML input의 name 속성)
     */
    String getName();
    
    /**
     * 필드 라벨 (UI에 표시될 텍스트)
     */
    String getLabel();
    
    /**
     * 필드 타입
     */
    FormFieldType getType();
    
    /**
     * 필수 입력 여부
     */
    boolean isRequired();
    
    /**
     * 기본값
     */
    Object getDefaultValue();
    
    /**
     * 유효성 검증 규칙
     */
    Map<String, Object> getValidationRules();
    
    /**
     * 추가 옵션 (placeholder, maxLength, options 등)
     */
    Map<String, Object> getOptions();
    
    /**
     * 설명 텍스트 (도움말)
     */
    String getDescription();
}