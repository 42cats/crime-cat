package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.UUID;

/**
 * 게임 테마 댓글 답글 생성 이벤트
 * 사용자가 게임 테마 댓글에 답글을 작성할 때 부모 댓글 작성자에게 알림
 */
@Getter

public class GameThemeCommentRepliedEvent extends NotificationEvent {
    
    // 게임 테마 정보
    private final UUID themeId;
    private final String themeTitle;
    private final String themeType; // CRIMESCENE, ESCAPE_ROOM 등
    
    // 답글 정보
    private final UUID replyId;
    private final String replyContent;
    private final UUID parentCommentId;
    private final UUID replierId;
    private final String replierNickname;
    
    public GameThemeCommentRepliedEvent(Object source, UUID parentCommentAuthorId, UUID themeId, String themeTitle,
                                       String themeType, UUID replyId, String replyContent, UUID parentCommentId,
                                       UUID replierId, String replierNickname) {
        super(source, parentCommentAuthorId, replierId);
        this.themeId = themeId;
        this.themeTitle = themeTitle;
        this.themeType = themeType;
        this.replyId = replyId;
        this.replyContent = replyContent;
        this.parentCommentId = parentCommentId;
        this.replierId = replierId;
        this.replierNickname = replierNickname;
        
        // 기본 제목과 메시지 설정
        String shortContent = replyContent.length() > 50 ? 
            replyContent.substring(0, 50) + "..." : replyContent;
        
        this.withTitle("댓글에 새 답글")
            .withMessage(String.format("%s님이 \"%s\" 테마의 댓글에 답글을 남겼습니다: %s", 
                replierNickname, themeTitle, shortContent))
            .withData("themeId", themeId)
            .withData("themeTitle", themeTitle)
            .withData("themeType", themeType)
            .withData("replyId", replyId)
            .withData("replyContent", replyContent)
            .withData("parentCommentId", parentCommentId)
            .withData("replierId", replierId)
            .withData("replierNickname", replierNickname)
            .withData("linkUrl", generateLinkUrl(themeType, themeId, replyId));
    }
    
    /**
     * 테마 타입에 따른 URL 생성
     */
    private String generateLinkUrl(String themeType, UUID themeId, UUID commentId) {
        if ("CRIMESCENE".equals(themeType)) {
            return String.format("/themes/crimescene/%s#comment-%s", themeId, commentId);
        } else if ("ESCAPE_ROOM".equals(themeType)) {
            return String.format("/themes/escape_room/%s#comment-%s", themeId, commentId);
        }
        return String.format("/themes/%s#comment-%s", themeId, commentId);
    }
    
    /**
     * 팩토리 메서드
     */
    public static GameThemeCommentRepliedEvent of(Object source, UUID parentCommentAuthorId, UUID themeId, 
                                                  String themeTitle, String themeType, UUID replyId, 
                                                  String replyContent, UUID parentCommentId,
                                                  UUID replierId, String replierNickname) {
        return new GameThemeCommentRepliedEvent(source, parentCommentAuthorId, themeId, themeTitle, themeType,
                                               replyId, replyContent, parentCommentId, replierId, replierNickname);
    }
}
