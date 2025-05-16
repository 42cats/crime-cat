package com.crimecat.backend.notification.template;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;

/**
 * 템플릿 구현을 위한 추상 베이스 클래스
 * 공통 기능과 기본 구현을 제공
 */
@RequiredArgsConstructor
public abstract class AbstractNotificationTemplate implements NotificationTemplate {
    
    protected final MessageRenderer messageRenderer;
    
    // 템플릿 정의
    protected abstract String getTitleTemplate();
    protected abstract String getMessageTemplate();
    
    @Override
    public String getTitle(Map<String, Object> context) {
        validate(context);
        return messageRenderer.render(getTitleTemplate(), context);
    }
    
    @Override
    public String getMessage(Map<String, Object> context) {
        validate(context);
        return messageRenderer.render(getMessageTemplate(), context);
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
}
