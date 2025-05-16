package com.crimecat.backend.notification.template;

import com.crimecat.backend.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 템플릿 시스템을 통합하여 제공하는 서비스
 * Builder와 Event가 템플릿을 사용할 수 있도록 인터페이스 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService {
    
    private final TemplateRegistry templateRegistry;
    
    /**
     * 템플릿을 사용하여 제목 생성
     */
    public String renderTitle(NotificationType type, Map<String, Object> context) {
        NotificationTemplate template = templateRegistry.getTemplateOrDefault(type);
        try {
            return template.getTitle(context);
        } catch (Exception e) {
            log.error("Error rendering title for type {}: {}", type, e.getMessage(), e);
            return (String) context.getOrDefault("title", "알림");
        }
    }
    
    /**
     * 템플릿을 사용하여 메시지 생성
     */
    public String renderMessage(NotificationType type, Map<String, Object> context) {
        NotificationTemplate template = templateRegistry.getTemplateOrDefault(type);
        try {
            return template.getMessage(context);
        } catch (Exception e) {
            log.error("Error rendering message for type {}: {}", type, e.getMessage(), e);
            return (String) context.getOrDefault("message", "새로운 알림이 있습니다.");
        }
    }
    
    /**
     * 템플릿의 기본 데이터 조회
     */
    public Map<String, Object> getDefaultData(NotificationType type) {
        NotificationTemplate template = templateRegistry.getTemplateOrDefault(type);
        return template.getDefaultData();
    }
    
    /**
     * 템플릿의 기본 만료 시간 조회
     */
    public LocalDateTime getDefaultExpiresAt(NotificationType type) {
        NotificationTemplate template = templateRegistry.getTemplateOrDefault(type);
        return template.getDefaultExpiresAt();
    }
    
    /**
     * 템플릿 렌더링 결과를 담는 DTO
     */
    public static class RenderedTemplate {
        private final String title;
        private final String message;
        private final Map<String, Object> defaultData;
        private final LocalDateTime defaultExpiresAt;
        
        public RenderedTemplate(String title, String message, Map<String, Object> defaultData, LocalDateTime defaultExpiresAt) {
            this.title = title;
            this.message = message;
            this.defaultData = defaultData;
            this.defaultExpiresAt = defaultExpiresAt;
        }
        
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public Map<String, Object> getDefaultData() { return defaultData; }
        public LocalDateTime getDefaultExpiresAt() { return defaultExpiresAt; }
    }
    
    /**
     * 템플릿 렌더링 결과를 한 번에 반환
     */
    public RenderedTemplate render(NotificationType type, Map<String, Object> context) {
        String title = renderTitle(type, context);
        String message = renderMessage(type, context);
        Map<String, Object> defaultData = getDefaultData(type);
        LocalDateTime defaultExpiresAt = getDefaultExpiresAt(type);
        
        return new RenderedTemplate(title, message, defaultData, defaultExpiresAt);
    }
}
