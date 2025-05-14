package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;

/**
 * 숨겨진 폼 필드 (notificationId 등 전달 시 사용)
 */
public class HiddenField extends AbstractFormField {
    
    private HiddenField(Builder builder) {
        super(builder);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder extends AbstractFormField.Builder {
        public Builder() {
            super.type(FormFieldType.HIDDEN);
        }
        
        @Override
        public Builder label(String label) {
            // 숨겨진 필드는 라벨이 없으므로 무시
            return this;
        }
        
        @Override
        public HiddenField build() {
            // 숨겨진 필드는 required 값 무시
            this.required = false;
            return new HiddenField(this);
        }
    }
}