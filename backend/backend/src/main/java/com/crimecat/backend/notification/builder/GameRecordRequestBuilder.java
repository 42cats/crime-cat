package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 게임 기록 요청 알림을 위한 전용 빌더
 * 제네릭을 사용하여 타입 안전성 확보
 */
public class GameRecordRequestBuilder extends NotificationBuilder<GameRecordRequestBuilder> {
    
    private final UUID gameThemeId;
    private final UUID requesterId;
    
    public GameRecordRequestBuilder(NotificationService notificationService, TemplateService templateService, 
                                    UUID gameThemeId, UUID requesterId) {
        super(notificationService, templateService, NotificationType.GAME_RECORD_REQUEST);
        this.gameThemeId = gameThemeId;
        this.requesterId = requesterId;
    }
    
    /**
     * 게임 기록 요청 메시지 설정 (체이닝)
     * 타입 안전성을 위해 self()를 반환
     */
    public GameRecordRequestBuilder withMessage(String customMessage) {
        return message(customMessage);
    }
    
    /**
     * 요청자 닉네임 설정 (체이닝)
     */
    public GameRecordRequestBuilder withRequesterNickname(String nickname) {
        return data("requesterNickname", nickname);
    }
    
    /**
     * 게임 테마 제목 설정 (체이닝)
     */
    public GameRecordRequestBuilder withGameThemeTitle(String themeTitle) {
        return data("gameThemeTitle", themeTitle);
    }
    
    /**
     * 알림 준비 - 게임 기록 요청 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 템플릿에서 사용할 컨텍스트 데이터 설정
        data("gameThemeId", gameThemeId);
        data("requesterId", requesterId);
        data("requestMessage", message); // 원래 메시지를 컨텍스트로 포함
        
        // 기본 메타데이터 설정
        data("notificationType", "GAME_RECORD_REQUEST");
    }
    
    /**
     * 추가 검증 - 게임 기록 요청 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (gameThemeId == null) {
            throw new IllegalArgumentException("Game Theme ID is required for game record request");
        }
        if (requesterId == null) {
            throw new IllegalArgumentException("Requester ID is required for game record request");
        }
    }
}
