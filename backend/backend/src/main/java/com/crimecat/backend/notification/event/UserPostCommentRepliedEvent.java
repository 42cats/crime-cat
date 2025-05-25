package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.UUID;

/**
 * 유저 포스트 댓글 답글 생성 이벤트
 * 사용자가 댓글에 답글을 작성할 때 부모 댓글 작성자에게 알림
 */
@Getter
public class UserPostCommentRepliedEvent extends NotificationEvent {
    
    // 답글 정보
    private final UUID replyId;
    private final String replyContent;
    private final UUID parentCommentId;
    private final UUID postId;
    private final UUID replierId;
    private final String replierNickname;
    
    public UserPostCommentRepliedEvent(Object source, UUID parentCommentAuthorId, UUID replyId, String replyContent,
                                      UUID parentCommentId, UUID postId, UUID replierId, String replierNickname) {
        super(source, parentCommentAuthorId, replierId);
        this.replyId = replyId;
        this.replyContent = replyContent;
        this.parentCommentId = parentCommentId;
        this.postId = postId;
        this.replierId = replierId;
        this.replierNickname = replierNickname;
        
        // 기본 제목과 메시지 설정
        String shortContent = replyContent.length() > 50 ? 
            replyContent.substring(0, 50) + "..." : replyContent;
        
        this.withTitle("새 답글 알림")
            .withMessage(String.format("%s님이 회원님의 댓글에 답글을 남겼습니다: %s", replierNickname, shortContent))
            .withData("replyId", replyId)
            .withData("replyContent", replyContent)
            .withData("parentCommentId", parentCommentId)
            .withData("postId", postId)
            .withData("replierId", replierId)
            .withData("replierNickname", replierNickname)
            .withData("linkUrl", "/posts/" + postId + "#comment-" + replyId);
    }
    
    /**
     * BoardType을 포함한 생성자
     */
    public UserPostCommentRepliedEvent(Object source, UUID parentCommentAuthorId, UUID replyId, String replyContent,
                                      UUID parentCommentId, UUID postId, UUID replierId, String replierNickname, String boardType) {
        super(source, parentCommentAuthorId, replierId);
        this.replyId = replyId;
        this.replyContent = replyContent;
        this.parentCommentId = parentCommentId;
        this.postId = postId;
        this.replierId = replierId;
        this.replierNickname = replierNickname;
        
        // 기본 제목과 메시지 설정
        String shortContent = replyContent.length() > 50 ? 
            replyContent.substring(0, 50) + "..." : replyContent;
        
        this.withTitle("새 답글 알림")
            .withMessage(String.format("%s님이 회원님의 댓글에 답글을 남겼습니다: %s", replierNickname, shortContent))
            .withData("replyId", replyId)
            .withData("replyContent", replyContent)
            .withData("parentCommentId", parentCommentId)
            .withData("postId", postId)
            .withData("replierId", replierId)
            .withData("replierNickname", replierNickname)
            .withData("boardType", boardType)
            .withData("linkUrl", generateBoardUrl(boardType, postId, replyId));
    }
    
    /**
     * BoardType에 따른 URL 생성
     */
    private String generateBoardUrl(String boardType, UUID postId, UUID commentId) {
        if (boardType == null) {
            return "/posts/" + postId + "#comment-" + commentId;
        }
        
        String basePath;
        switch (boardType.toUpperCase()) {
            case "CHAT":
                basePath = "/community/chat/";
                break;
            case "QUESTION":
                basePath = "/community/question/";
                break;
            case "CREATOR":
                basePath = "/community/creator/";
                break;
            default:
                basePath = "/posts/";
        }
        
        return basePath + postId + "#comment-" + commentId;
    }
    
    /**
     * 팩토리 메서드 - BoardType 포함
     */
    public static UserPostCommentRepliedEvent of(Object source, UUID parentCommentAuthorId, UUID replyId, String replyContent,
                                                UUID parentCommentId, UUID postId, UUID replierId, String replierNickname, String boardType) {
        return new UserPostCommentRepliedEvent(source, parentCommentAuthorId, replyId, replyContent,
                                              parentCommentId, postId, replierId, replierNickname, boardType);
    }
}