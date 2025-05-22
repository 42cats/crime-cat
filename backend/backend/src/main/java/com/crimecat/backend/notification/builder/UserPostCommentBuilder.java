package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 유저 포스트 댓글 알림을 위한 전용 빌더
 */
public class UserPostCommentBuilder extends NotificationBuilder<UserPostCommentBuilder> {
    
    private final UUID postId;
    private final UUID commenterId;
    
    public UserPostCommentBuilder(NotificationService notificationService, TemplateService templateService,
                                 UUID postId, UUID commenterId) {
        super(notificationService, templateService, NotificationType.USER_POST_COMMENT);
        this.postId = postId;
        this.commenterId = commenterId;
    }
    
    /**
     * 댓글 작성자 닉네임 설정 (체이닝)
     */
    public UserPostCommentBuilder withCommenterNickname(String commenterNickname) {
        return data("commenterNickname", commenterNickname);
    }
    
    /**
     * 댓글 내용 설정 (체이닝)
     */
    public UserPostCommentBuilder withCommentContent(String commentContent) {
        return data("commentContent", commentContent);
    }
    
    /**
     * 댓글 ID 설정 (체이닝)
     */
    public UserPostCommentBuilder withCommentId(UUID commentId) {
        return data("commentId", commentId);
    }
    
    /**
     * 알림 준비 - 댓글 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 필수 데이터 설정
        data("postId", postId);
        data("commenterId", commenterId);
        data("notificationType", "USER_POST_COMMENT");
        data("linkUrl", "/sns/post/" + postId);
    }
    
    /**
     * 추가 검증 - 댓글 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (postId == null) {
            throw new IllegalArgumentException("Post ID is required for comment notification");
        }
        if (commenterId == null) {
            throw new IllegalArgumentException("Commenter ID is required for comment notification");
        }
    }
}