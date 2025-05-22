package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 새 유저 포스트 알림을 위한 전용 빌더
 */
public class UserPostNewBuilder extends NotificationBuilder<UserPostNewBuilder> {
    
    private final UUID postId;
    private final UUID authorId;
    
    public UserPostNewBuilder(NotificationService notificationService, TemplateService templateService,
                             UUID postId, UUID authorId) {
        super(notificationService, templateService, NotificationType.USER_POST_NEW);
        this.postId = postId;
        this.authorId = authorId;
    }
    
    /**
     * 작성자 닉네임 설정 (체이닝)
     */
    public UserPostNewBuilder withAuthorNickname(String authorNickname) {
        return data("authorNickname", authorNickname);
    }
    
    /**
     * 포스트 내용 설정 (체이닝)
     */
    public UserPostNewBuilder withPostContent(String postContent) {
        return data("postContent", postContent);
    }
    
    /**
     * 알림 준비 - 새 포스트 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 필수 데이터 설정
        data("postId", postId);
        data("authorId", authorId);
        data("notificationType", "USER_POST_NEW");
        data("linkUrl", "/posts/" + postId);
    }
    
    /**
     * 추가 검증 - 새 포스트 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (postId == null) {
            throw new IllegalArgumentException("Post ID is required for user post notification");
        }
        if (authorId == null) {
            throw new IllegalArgumentException("Author ID is required for user post notification");
        }
    }
}