package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;

import java.util.UUID;

/**
 * 게임 기록 요청 알림을 위한 전용 빌더
 */
public class GameRecordRequestBuilder extends NotificationBuilder {
    
    private final UUID gameThemeId;
    private final UUID requesterId;
    
    public GameRecordRequestBuilder(NotificationService notificationService, UUID gameThemeId, UUID requesterId) {
        super(notificationService, NotificationType.GAME_RECORD_REQUEST);
        this.gameThemeId = gameThemeId;
        this.requesterId = requesterId;
    }
    
    /**
     * 게임 기록 요청 메시지 설정 (체이닝)
     */
    public GameRecordRequestBuilder withMessage(String customMessage) {
        return (GameRecordRequestBuilder) message(customMessage);
    }
    
    /**
     * 알림 준비 - 게임 기록 요청 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 제목 설정
        if (title == null) {
            title = "게임 기록 등록 요청";
        }
        
        // 기본 메시지 설정
        if (message == null) {
            message = "새로운 게임 기록 등록 요청이 있습니다. 요청을 확인해주세요.";
        }
        
        // 필수 데이터 설정
        data("gameThemeId", gameThemeId);
        data("requesterId", requesterId);
        data("notificationType", "GAME_RECORD_REQUEST");
        
        // 만료시간이 설정되지 않은 경우 기본값 설정 (7일)
        if (expiresAt == null) {
            expiresAt = java.time.LocalDateTime.now().plusDays(7);
        }
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
