package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractNotificationTemplate;
import com.crimecat.backend.notification.template.MessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * 게임 기록 요청 알림 템플릿
 */
@Component
public class GameRecordRequestTemplate extends AbstractNotificationTemplate implements TypedNotificationTemplate {
    
    public GameRecordRequestTemplate(MessageRenderer messageRenderer) {
        super(messageRenderer);
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
        return "${requesterNickname}님이 ${gameThemeTitle} 테마에 대한 게임 기록 등록을 요청했습니다." +
               "{{? requestMessage : \n요청 메시지: ${requestMessage} : }}";
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
}
