package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * 게임 테마 댓글 생성 이벤트
 * 사용자가 게임 테마에 댓글을 작성할 때 테마 작성자/팀원들에게 알림
 */
@Getter

public class GameThemeCommentedEvent extends NotificationEvent {
    
    // 게임 테마 정보
    private final UUID themeId;
    private final String themeTitle;
    private final String themeType; // CRIMESCENE, ESCAPE_ROOM 등
    
    // 댓글 정보
    private final UUID commentId;
    private final String commentContent;
    private final UUID commenterId;
    private final String commenterNickname;
    
    // 알림 받을 사용자 목록 (크라임씬의 경우 팀원들)
    private final List<UUID> targetUserIds;
    
    public GameThemeCommentedEvent(Object source, List<UUID> targetUserIds, UUID themeId, String themeTitle,
                                  String themeType, UUID commentId, String commentContent,
                                  UUID commenterId, String commenterNickname) {
        super(source, targetUserIds.isEmpty() ? null : targetUserIds.get(0), commenterId);
        this.targetUserIds = targetUserIds;
        this.themeId = themeId;
        this.themeTitle = themeTitle;
        this.themeType = themeType;
        this.commentId = commentId;
        this.commentContent = commentContent;
        this.commenterId = commenterId;
        this.commenterNickname = commenterNickname;
        
        // 기본 제목과 메시지 설정
        String shortContent = commentContent.length() > 50 ? 
            commentContent.substring(0, 50) + "..." : commentContent;
        
        this.withTitle("테마에 새 댓글")
            .withMessage(String.format("%s님이 \"%s\" 테마에 댓글을 남겼습니다: %s", 
                commenterNickname, themeTitle, shortContent))
            .withData("themeId", themeId)
            .withData("themeTitle", themeTitle)
            .withData("themeType", themeType)
            .withData("commentId", commentId)
            .withData("commentContent", commentContent)
            .withData("commenterId", commenterId)
            .withData("commenterNickname", commenterNickname)
            .withData("linkUrl", generateLinkUrl(themeType, themeId, commentId));
    }
    
    /**
     * 테마 타입에 따른 URL 생성
     */
    private String generateLinkUrl(String themeType, UUID themeId, UUID commentId) {
        if ("CRIMESCENE".equals(themeType)) {
            return String.format("/themes/crimescene/%s#comment-%s", themeId, commentId);
        } else if ("ESCAPE_ROOM".equals(themeType)) {
            return String.format("/themes/escape-room/%s#comment-%s", themeId, commentId);
        }
        return String.format("/themes/%s#comment-%s", themeId, commentId);
    }
    
    /**
     * 팩토리 메서드 - 다중 수신자
     */
    public static GameThemeCommentedEvent of(Object source, List<UUID> targetUserIds, UUID themeId, String themeTitle,
                                           String themeType, UUID commentId, String commentContent,
                                           UUID commenterId, String commenterNickname) {
        return new GameThemeCommentedEvent(source, targetUserIds, themeId, themeTitle, themeType,
                                         commentId, commentContent, commenterId, commenterNickname);
    }
    
    /**
     * 팩토리 메서드 - 단일 수신자
     */
    public static GameThemeCommentedEvent forSingleUser(Object source, UUID targetUserId, UUID themeId, 
                                                       String themeTitle, String themeType, UUID commentId, 
                                                       String commentContent, UUID commenterId, String commenterNickname) {
        return new GameThemeCommentedEvent(source, List.of(targetUserId), themeId, themeTitle, themeType,
                                         commentId, commentContent, commenterId, commenterNickname);
    }
}
