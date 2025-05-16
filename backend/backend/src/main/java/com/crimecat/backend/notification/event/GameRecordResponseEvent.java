package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.UUID;

/**
 * 게임 기록 응답 이벤트 (승인/거절)
 * 게임 기록 요청에 대한 처리 결과를 알리는 이벤트
 */
@Getter
public class GameRecordResponseEvent extends NotificationEvent {
    
    // 원본 요청 정보
    private final UUID originalRequestId;
    private final UUID gameThemeId;
    
    // 응답 정보
    private final boolean approved;
    private final String responseMessage;
    private final UUID responderId;
    
    public GameRecordResponseEvent(Object source, UUID originalRequestId, UUID gameThemeId,
                                   UUID requesterId, UUID responderId, boolean approved, String responseMessage) {
        super(source, requesterId, responderId);
        this.originalRequestId = originalRequestId;
        this.gameThemeId = gameThemeId;
        this.approved = approved;
        this.responseMessage = responseMessage;
        this.responderId = responderId;
        
        // 승인/거절에 따른 기본 제목과 메시지 설정
        String defaultTitle = approved ? "게임 기록 승인됨" : "게임 기록 거절됨";
        String defaultMessage = approved 
            ? "요청하신 게임 기록이 승인되었습니다."
            : (responseMessage != null ? responseMessage : "게임 기록 요청이 거절되었습니다.");
            
        this.withTitle(defaultTitle)
            .withMessage(defaultMessage)
            .withData("originalRequestId", originalRequestId)
            .withData("gameThemeId", gameThemeId)
            .withData("approved", approved)
            .withData("responseMessage", responseMessage)
            .withData("responderId", responderId);
    }
    
    /**
     * 승인 이벤트 팩토리 메서드
     */
    public static GameRecordResponseEvent approved(Object source, UUID originalRequestId, UUID gameThemeId,
                                                   UUID requesterId, UUID responderId) {
        return new GameRecordResponseEvent(source, originalRequestId, gameThemeId, 
                                          requesterId, responderId, true, 
                                          "요청하신 게임 기록이 승인되었습니다.");
    }
    
    /**
     * 거절 이벤트 팩토리 메서드
     */
    public static GameRecordResponseEvent rejected(Object source, UUID originalRequestId, UUID gameThemeId,
                                                   UUID requesterId, UUID responderId, String reason) {
        return new GameRecordResponseEvent(source, originalRequestId, gameThemeId, 
                                          requesterId, responderId, false, reason);
    }
}
