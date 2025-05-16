package com.crimecat.backend.notification.template;

import com.crimecat.backend.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 알림 타입별 템플릿을 관리하는 레지스트리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TemplateRegistry {
    
    private final Map<NotificationType, NotificationTemplate> templates = new EnumMap<>(NotificationType.class);
    
    /**
     * 생성자에서 템플릿 등록
     */
    public TemplateRegistry(List<NotificationTemplate> templateList) {
        registerTemplates(templateList);
    }
    
    /**
     * 모든 템플릿을 등록
     */
    private void registerTemplates(List<NotificationTemplate> templateList) {
        for (NotificationTemplate template : templateList) {
            if (template instanceof TypedNotificationTemplate) {
                TypedNotificationTemplate typedTemplate = (TypedNotificationTemplate) template;
                NotificationType type = typedTemplate.getNotificationType();
                templates.put(type, template);
                log.info("Registered template for type: {}", type);
            }
        }
    }
    
    /**
     * 특정 타입의 템플릿 조회
     */
    public Optional<NotificationTemplate> getTemplate(NotificationType type) {
        return Optional.ofNullable(templates.get(type));
    }
    
    /**
     * 특정 타입의 템플릿 조회 (기본값 포함)
     */
    public NotificationTemplate getTemplateOrDefault(NotificationType type) {
        return getTemplate(type).orElse(new DefaultNotificationTemplate());
    }
    
    /**
     * 템플릿 동적 등록 (런타임 변경 지원)
     */
    public void registerTemplate(NotificationType type, NotificationTemplate template) {
        templates.put(type, template);
        log.info("Dynamically registered template for type: {}", type);
    }
    
    /**
     * 등록된 모든 템플릿 타입 조회
     */
    public java.util.Set<NotificationType> getRegisteredTypes() {
        return templates.keySet();
    }
    
    /**
     * 기본 템플릿 (템플릿이 등록되지 않은 경우 사용)
     */
    private static class DefaultNotificationTemplate implements NotificationTemplate {
        @Override
        public String getTitle(Map<String, Object> context) {
            return (String) context.getOrDefault("title", "알림");
        }
        
        @Override
        public String getMessage(Map<String, Object> context) {
            return (String) context.getOrDefault("message", "새로운 알림이 있습니다.");
        }
        
        @Override
        public Map<String, Object> getDefaultData() {
            return Map.of();
        }
        
        @Override
        public java.util.Set<String> getSupportedContextKeys() {
            return java.util.Set.of("title", "message");
        }
    }
}
