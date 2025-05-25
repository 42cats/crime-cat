package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 유저 포스트 댓글 답글 알림을 위한 전용 빌더
 */
public class UserPostCommentReplyBuilder extends NotificationBuilder<UserPostCommentReplyBuilder> {
    
    private final UUID parentCommentId;
    private final UUID replierId;
    
    public UserPostCommentReplyBuilder(NotificationService notificationService, TemplateService templateService,
                                      UUID parentCommentId, UUID replierId) {
        super(notificationService, templateService, NotificationType.USER_POST_COMMENT_REPLY);
        this.parentCommentId = parentCommentId;
        this.replierId = replierId;
    }
    
    /**
     * 답글 작성자 닉네임 설정 (체이닝)
     */
    public UserPostCommentReplyBuilder withReplierNickname(String replierNickname) {
        return data("replierNickname", replierNickname);
    }
    
    /**
     * 답글 내용 설정 (체이닝)
     */
    public UserPostCommentReplyBuilder withReplyContent(String replyContent) {
        return data("replyContent", replyContent);
    }
    
    /**
     * 답글 ID 설정 (체이닝)
     */
    public UserPostCommentReplyBuilder withReplyId(UUID replyId) {
        return data("replyId", replyId);
    }
    
    /**
     * 포스트 ID 설정 (체이닝)
     */
    public UserPostCommentReplyBuilder withPostId(UUID postId) {
        return data("postId", postId);
    }
    
    /**
     * 알림 준비 - 답글 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 필수 데이터 설정
        data("parentCommentId", parentCommentId);
        data("replierId", replierId);
        data("notificationType", "USER_POST_COMMENT_REPLY");
        
        // linkUrl 설정 - postId가 있는 경우에만, 이미 설정되어 있지 않은 경우에만
        if (!data.containsKey("linkUrl")) {
            Object postIdObj = this.data.get("postId");
            if (postIdObj != null) {
                data("linkUrl", "/sns/post/" + postIdObj);
            }
        }
    }
    
    /**
     * 추가 검증 - 답글 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (parentCommentId == null) {
            throw new IllegalArgumentException("Parent comment ID is required for reply notification");
        }
        if (replierId == null) {
            throw new IllegalArgumentException("Replier ID is required for reply notification");
        }
    }
}