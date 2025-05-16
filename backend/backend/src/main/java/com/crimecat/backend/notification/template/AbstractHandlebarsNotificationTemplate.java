package com.crimecat.backend.notification.template;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;

/**
 * Handlebars 템플릿 구현을 위한 추상 베이스 클래스
 * 공통 기능과 기본 구현을 제공
 */
@RequiredArgsConstructor
public abstract class AbstractHandlebarsNotificationTemplate implements NotificationTemplate {
    
    protected final HandlebarsMessageRenderer handlebarsMessageRenderer;
    
    // 템플릿 정의
    protected abstract String getTitleTemplate();
    protected abstract String getMessageTemplate();
    
    @Override
    public String getTitle(Map<String, Object> context) {
        validate(context);
        Map<String, Object> enrichedContext = enrichContext(context);
        return handlebarsMessageRenderer.render(getTitleTemplate(), enrichedContext);
    }
    
    @Override
    public String getMessage(Map<String, Object> context) {
        validate(context);
        Map<String, Object> enrichedContext = enrichContext(context);
        return handlebarsMessageRenderer.render(getMessageTemplate(), enrichedContext);
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of();
    }
    
    /**
     * 컨텍스트에 기본값 추가
     */
    protected Map<String, Object> enrichContext(Map<String, Object> context) {
        Map<String, Object> enrichedContext = new HashMap<>(context);
        
        // 현재 시간 추가
        enrichedContext.put("now", LocalDateTime.now());
        
        // 기본 데이터 추가
        getDefaultData().forEach(enrichedContext::putIfAbsent);
        
        return enrichedContext;
    }
    
    /**
     * 템플릿별 기본 만료 시간 설정
     */
    protected int getDefaultExpirationDays() {
        return 7;
    }
    
    @Override
    public LocalDateTime getDefaultExpiresAt() {
        return LocalDateTime.now().plusDays(getDefaultExpirationDays());
    }
    
    /**
     * 기본 검증 로직
     */
    public void validate(Map<String, Object> context) {
        if (context == null) {
            throw new IllegalArgumentException("Context cannot be null");
        }
        validateRequiredKeys(context);
    }
    
    /**
     * 필수 키 검증
     */
    protected void validateRequiredKeys(Map<String, Object> context) {
        // 하위 클래스에서 오버라이드 가능
    }
}
