package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;

/**
 * 날짜 입력 폼 필드
 */
public class DateField extends AbstractFormField {
    
    private DateField(Builder builder) {
        super(builder);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder extends AbstractFormField.Builder {
        public Builder() {
            super.type(FormFieldType.DATE);
        }
        
        @Override
        public DateField build() {
            return new DateField(this);
        }
    }
}
