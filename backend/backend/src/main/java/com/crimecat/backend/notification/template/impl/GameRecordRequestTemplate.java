package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractHandlebarsNotificationTemplate;
import com.crimecat.backend.notification.template.HandlebarsMessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * 게임 기록 요청 알림 템플릿 - Handlebars 버전
 */
@Component
public class GameRecordRequestTemplate extends AbstractHandlebarsNotificationTemplate implements TypedNotificationTemplate {
    
    public GameRecordRequestTemplate(HandlebarsMessageRenderer handlebarsMessageRenderer) {
        super(handlebarsMessageRenderer);
    }
    
    @Override
    public NotificationType getNotificationType() {
        return NotificationType.GAME_RECORD_REQUEST;
    }
    
    @Override
    protected String getTitleTemplate() {
        return "게임 기록 등록 요청";
    }
    
    @Override
    protected String getMessageTemplate() {
        // 실제 개행 문자 사용
        return "{{requesterNickname}}님이 {{gameThemeTitle}} 테마에 대한 게임 기록 등록을 요청했습니다.\n\n"
               + "{{#if requestMessage}}요청 메시지: {{requestMessage}}{{/if}}";
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of(
            "category", "game",
            "priority", "normal",
            "actionRequired", true
        );
    }
    
    @Override
    protected int getDefaultExpirationDays() {
        return 7; // 게임 기록 요청은 7일 후 만료
    }
    
    @Override
    public Set<String> getSupportedContextKeys() {
        return Set.of(
            "requesterNickname",   // 요청자 닉네임
            "gameThemeTitle",      // 게임 테마 제목
            "requestMessage",      // 요청 메시지 (선택적)
            "gameThemeId",         // 게임 테마 ID
            "requesterId"          // 요청자 ID
        );
    }
    
    @Override
    public Set<String> getRequiredContextKeys() {
        return Set.of(
            "requesterNickname",
            "gameThemeTitle"
        );
    }
    
    @Override
    protected void validateRequiredKeys(Map<String, Object> context) {
        for (String key : getRequiredContextKeys()) {
            if (!context.containsKey(key) || context.get(key) == null) {
                throw new IllegalArgumentException("Required context key missing: " + key);
            }
        }
    }
}
