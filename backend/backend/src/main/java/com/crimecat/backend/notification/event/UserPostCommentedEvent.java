package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.UUID;

/**
 * 유저 포스트 댓글 생성 이벤트
 * 사용자가 포스트에 댓글을 작성할 때 포스트 작성자에게 알림
 */
@Getter
public class UserPostCommentedEvent extends NotificationEvent {
    
    // 댓글 정보
    private final UUID commentId;
    private final String commentContent;
    private final UUID postId;
    private final UUID commenterId;
    private final String commenterNickname;
    
    public UserPostCommentedEvent(Object source, UUID postAuthorId, UUID commentId, String commentContent,
                                 UUID postId, UUID commenterId, String commenterNickname) {
        super(source, postAuthorId, commenterId);
        this.commentId = commentId;
        this.commentContent = commentContent;
        this.postId = postId;
        this.commenterId = commenterId;
        this.commenterNickname = commenterNickname;
        
        // 기본 제목과 메시지 설정
        String shortContent = commentContent.length() > 50 ? 
            commentContent.substring(0, 50) + "..." : commentContent;
        
        this.withTitle("새 댓글 알림")
            .withMessage(String.format("%s님이 회원님의 게시글에 댓글을 남겼습니다: %s", commenterNickname, shortContent))
            .withData("commentId", commentId)
            .withData("commentContent", commentContent)
            .withData("postId", postId)
            .withData("commenterId", commenterId)
            .withData("commenterNickname", commenterNickname)
            .withData("linkUrl", "/posts/" + postId + "#comment-" + commentId);
    }
    
    /**
     * 팩토리 메서드
     */
    public static UserPostCommentedEvent of(Object source, UUID postAuthorId, UUID commentId, String commentContent,
                                           UUID postId, UUID commenterId, String commenterNickname) {
        return new UserPostCommentedEvent(source, postAuthorId, commentId, commentContent,
                                         postId, commenterId, commenterNickname);
    }
}