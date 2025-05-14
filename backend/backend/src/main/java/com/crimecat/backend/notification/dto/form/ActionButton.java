package com.crimecat.backend.notification.dto.form;

import com.crimecat.backend.notification.enums.ActionButtonType;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.HashMap;
import java.util.Map;

/**
 * 알림 액션 버튼 클래스
 * UI 스타일은 포함하지 않고 순수 비즈니스 액션만 정의
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActionButton {
    
    private final String id;
    private final ActionButtonType type;
    private final String label;
    private final String actionUrl;
    private final boolean requiresForm;
    private final Map<String, Object> metadata;
    
    private ActionButton(Builder builder) {
        this.id = builder.id;
        this.type = builder.type;
        this.label = builder.label != null ? builder.label : builder.type.getDefaultLabel();
        this.actionUrl = builder.actionUrl;
        this.requiresForm = builder.requiresForm;
        this.metadata = builder.metadata != null ? new HashMap<>(builder.metadata) : new HashMap<>();
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public String getId() {
        return id;
    }
    
    public ActionButtonType getType() {
        return type;
    }
    
    public String getLabel() {
        return label;
    }
    
    public String getActionUrl() {
        return actionUrl;
    }
    
    public boolean isRequiresForm() {
        return requiresForm;
    }
    
    public Map<String, Object> getMetadata() {
        return new HashMap<>(metadata);
    }
    
    public static class Builder {
        private String id;
        private ActionButtonType type;
        private String label;
        private String actionUrl;
        private boolean requiresForm = true;
        private Map<String, Object> metadata;
        
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder type(ActionButtonType type) {
            this.type = type;
            this.id = type.getValue(); // id를 type의 value로 자동 설정
            return this;
        }
        
        public Builder label(String label) {
            this.label = label;
            return this;
        }
        
        public Builder actionUrl(String actionUrl) {
            this.actionUrl = actionUrl;
            return this;
        }
        
        public Builder requiresForm(boolean requiresForm) {
            this.requiresForm = requiresForm;
            return this;
        }
        
        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public Builder addMetadata(String key, Object value) {
            if (this.metadata == null) {
                this.metadata = new HashMap<>();
            }
            this.metadata.put(key, value);
            return this;
        }
        
        public ActionButton build() {
            if (id == null || type == null || actionUrl == null) {
                throw new IllegalArgumentException("id, type, actionUrl are required");
            }
            return new ActionButton(this);
        }
    }
}