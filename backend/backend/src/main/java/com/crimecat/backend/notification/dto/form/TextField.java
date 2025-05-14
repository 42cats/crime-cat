package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;

import java.util.Map;

/**
 * 텍스트 입력 폼 필드
 */
public class TextField extends AbstractFormField {
    
    private TextField(Builder builder) {
        super(builder);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder extends AbstractFormField.Builder {
        public Builder() {
            super.type(FormFieldType.TEXT);
        }
        
        @Override
        public TextField build() {
            return new TextField(this);
        }
    }
}