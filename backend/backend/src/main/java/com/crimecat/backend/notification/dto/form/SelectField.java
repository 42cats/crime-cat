package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;

import java.util.List;
import java.util.Map;

/**
 * 선택 목록 폼 필드 (드롭다운, 라디오 버튼 등)
 */
public class SelectField extends AbstractFormField {
    
    private SelectField(Builder builder) {
        super(builder);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder extends AbstractFormField.Builder {
        public Builder() {
            super.type(FormFieldType.SELECT);
        }
        
        public Builder options(List<SelectOption> options) {
            if (super.options == null) {
                super.options = new java.util.HashMap<>();
            }
            super.options.put("options", options);
            return this;
        }
        
        public Builder multiple(boolean multiple) {
            if (super.options == null) {
                super.options = new java.util.HashMap<>();
            }
            super.options.put("multiple", multiple);
            return this;
        }
        
        @Override
        public SelectField build() {
            return new SelectField(this);
        }
    }
    
    /**
     * 선택 옵션 클래스
     */
    public static class SelectOption {
        private final String value;
        private final String label;
        private final boolean selected;
        
        public SelectOption(String value, String label, boolean selected) {
            this.value = value;
            this.label = label;
            this.selected = selected;
        }
        
        public SelectOption(String value, String label) {
            this(value, label, false);
        }
        
        public String getValue() {
            return value;
        }
        
        public String getLabel() {
            return label;
        }
        
        public boolean isSelected() {
            return selected;
        }
    }
}