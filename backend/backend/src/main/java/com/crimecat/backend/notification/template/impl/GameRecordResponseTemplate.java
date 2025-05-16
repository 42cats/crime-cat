package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractNotificationTemplate;
import com.crimecat.backend.notification.template.MessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * 게임 기록 응답(승인/거절) 알림 템플릿
 * Builder 패턴의 GameRecordResponseBuilder를 대체하는 템플릿
 */
@Component
public class GameRecordResponseTemplate extends AbstractNotificationTemplate implements TypedNotificationTemplate {
    
    public GameRecordResponseTemplate(MessageRenderer messageRenderer) {
        super(messageRenderer);
    }
    
    @Override
    public NotificationType getNotificationType() {
        // 현재는 SYSTEM_NOTICE로 처리되지만, 향후 GAME_RECORD_RESPONSE 타입 추가 가능
        return NotificationType.SYSTEM_NOTICE;
    }
    
    @Override
    protected String getTitleTemplate() {
        return "{{? approved : 게임 기록 승인됨 : 게임 기록 거절됨}}";
    }
    
    @Override
    protected String getMessageTemplate() {
        return "{{? approved : " +
               "요청하신 ${gameThemeTitle} 게임 기록이 승인되었습니다." +
               ":" +
               "요청하신 ${gameThemeTitle} 게임 기록이 거절되었습니다." +
               "{{? declineMessage : \n거절 사유: ${declineMessage} : }} }}" +
               "\n\n원본 요청 ID: ${originalNotificationId}";
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of(
            "category", "game",
            "priority", "normal",
            "actionRequired", false
        );
    }
    
    @Override
    protected int getDefaultExpirationDays() {
        return 30; // 응답 알림은 30일 후 만료
    }
    
    @Override
    public Set<String> getSupportedContextKeys() {
        return Set.of(
            "approved",                // 승인 여부 (boolean)
            "gameThemeTitle",          // 게임 테마 제목
            "ownerMemo",               // 관리자 메모 (승인 시, 선택적)
            "declineMessage",          // 거절 메시지 (거절 시, 선택적)
            "originalNotificationId",  // 원본 요청 ID
            "gameThemeId"              // 게임 테마 ID
        );
    }
    
    @Override
    public Set<String> getRequiredContextKeys() {
        return Set.of(
            "approved",
            "originalNotificationId"
        );
    }
}
