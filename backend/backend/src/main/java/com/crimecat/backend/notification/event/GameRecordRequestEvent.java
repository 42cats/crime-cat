package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 게임 기록 요청 이벤트
 * 사용자가 게임 기록 등록을 요청할 때 발생
 */
@Getter
public class GameRecordRequestEvent extends NotificationEvent {
    
    // 게임 테마 정보
    private final UUID gameThemeId;
    private final String gameThemeTitle;
    
    // 요청 관련 정보
    private final String requestMessage;
    private final UUID requesterId;
    
    public GameRecordRequestEvent(Object source, UUID gameThemeId, String gameThemeTitle,
                                  UUID requesterId, UUID receiverId, String requestMessage) {
        super(source, receiverId, requesterId);
        this.gameThemeId = gameThemeId;
        this.gameThemeTitle = gameThemeTitle;
        this.requesterId = requesterId;
        this.requestMessage = requestMessage;
        
        // 기본 제목과 메시지 설정
        this.withTitle("게임 기록 등록 요청")
            .withMessage(requestMessage)
            .withData("gameThemeId", gameThemeId)
            .withData("gameThemeTitle", gameThemeTitle)
            .withData("requesterId", requesterId)
            .withData("requestMessage", requestMessage)
            .withExpiresAt(LocalDateTime.now().plusDays(7)); // 7일 후 만료
    }
    
    /**
     * 팩토리 메서드
     */
    public static GameRecordRequestEvent of(Object source, UUID gameThemeId, String gameThemeTitle,
                                            UUID requesterId, UUID receiverId, String requestMessage) {
        return new GameRecordRequestEvent(source, gameThemeId, gameThemeTitle, 
                                         requesterId, receiverId, requestMessage);
    }
}
