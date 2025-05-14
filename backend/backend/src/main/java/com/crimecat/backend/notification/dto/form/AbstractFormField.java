package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.FormFieldType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.HashMap;
import java.util.Map;

/**
 * FormField의 추상 구현 클래스
 * 공통 필드와 로직을 제공
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class AbstractFormField implements FormField {
    
    protected final String name;
    protected final String label;
    protected final FormFieldType type;
    protected final boolean required;
    protected final Object defaultValue;
    protected final String description;
    protected final Map<String, Object> validationRules;
    protected final Map<String, Object> options;
    
    protected AbstractFormField(Builder builder) {
        this.name = builder.name;
        this.label = builder.label;
        this.type = builder.type;
        this.required = builder.required;
        this.defaultValue = builder.defaultValue;
        this.description = builder.description;
        this.validationRules = builder.validationRules != null ? 
            new HashMap<>(builder.validationRules) : new HashMap<>();
        this.options = builder.options != null ? 
            new HashMap<>(builder.options) : new HashMap<>();
    }
    
    @Override
    public String getName() {
        return name;
    }
    
    @Override
    public String getLabel() {
        return label;
    }
    
    @Override
    public FormFieldType getType() {
        return type;
    }
    
    @Override
    public boolean isRequired() {
        return required;
    }
    
    @Override
    public Object getDefaultValue() {
        return defaultValue;
    }
    
    @Override
    public String getDescription() {
        return description;
    }
    
    @Override
    public Map<String, Object> getValidationRules() {
        return new HashMap<>(validationRules);
    }
    
    @Override
    public Map<String, Object> getOptions() {
        return new HashMap<>(options);
    }
    
    /**
     * Builder 패턴을 위한 추상 빌더 클래스
     */
    public abstract static class Builder {
        protected String name;
        protected String label;
        protected FormFieldType type;
        protected boolean required = false;
        protected Object defaultValue;
        protected String description;
        protected Map<String, Object> validationRules;
        protected Map<String, Object> options;
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder label(String label) {
            this.label = label;
            return this;
        }
        
        public Builder type(FormFieldType type) {
            this.type = type;
            return this;
        }
        
        public Builder required(boolean required) {
            this.required = required;
            return this;
        }
        
        public Builder defaultValue(Object defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }
        
        public Builder description(String description) {
            this.description = description;
            return this;
        }
        
        public Builder validationRules(Map<String, Object> validationRules) {
            this.validationRules = validationRules;
            return this;
        }
        
        public Builder options(Map<String, Object> options) {
            this.options = options;
            return this;
        }
        
        public abstract FormField build();
    }
}