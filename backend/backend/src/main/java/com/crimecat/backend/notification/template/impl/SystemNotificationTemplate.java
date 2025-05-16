package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractNotificationTemplate;
import com.crimecat.backend.notification.template.MessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * 시스템 알림 템플릿
 */
@Component
public class SystemNotificationTemplate extends AbstractNotificationTemplate implements TypedNotificationTemplate {
    
    public SystemNotificationTemplate(MessageRenderer messageRenderer) {
        super(messageRenderer);
    }
    
    @Override
    public NotificationType getNotificationType() {
        return NotificationType.SYSTEM_NOTICE;
    }
    
    @Override
    protected String getTitleTemplate() {
        return "{{? titlePrefix : ${titlePrefix} - }}${title}";
    }
    
    @Override
    protected String getMessageTemplate() {
        return "${message}" +
               "{{? urgent : \n\n⚠️ 긴급 알림입니다. : }}" +
               "{{? actionUrl : \n\n자세한 내용: ${actionUrl} : }}";
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of(
            "category", "system",
            "priority", "normal",
            "actionRequired", false
        );
    }
    
    @Override
    protected int getDefaultExpirationDays() {
        return 30; // 시스템 알림은 30일 후 만료
    }
    
    @Override
    public Set<String> getSupportedContextKeys() {
        return Set.of(
            "title",           // 제목
            "message",         // 메시지
            "titlePrefix",     // 제목 접두사 (선택적)
            "urgent",          // 긴급 여부 (boolean)
            "actionUrl",       // 추가 정보 URL (선택적)
            "category",        // 카테고리
            "priority"         // 우선순위
        );
    }
    
    @Override
    public Set<String> getRequiredContextKeys() {
        return Set.of(
            "title",
            "message"
        );
    }
}
