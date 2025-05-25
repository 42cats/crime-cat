package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractHandlebarsNotificationTemplate;
import com.crimecat.backend.notification.template.HandlebarsMessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * 유저 포스트 댓글 알림 템플릿
 * 게시글이나 테마에 댓글이 달렸을 때 사용
 */
@Component
public class UserPostCommentTemplate extends AbstractHandlebarsNotificationTemplate implements TypedNotificationTemplate {
    
    public UserPostCommentTemplate(HandlebarsMessageRenderer handlebarsMessageRenderer) {
        super(handlebarsMessageRenderer);
    }
    
    @Override
    public NotificationType getNotificationType() {
        return NotificationType.USER_POST_COMMENT;
    }
    
    @Override
    protected String getTitleTemplate() {
        return "{{commenterNickname}}님이 댓글을 남겼습니다";
    }
    
    @Override
    protected String getMessageTemplate() {
        return "{{commenterNickname}}님이 회원님의 게시글에 댓글을 남겼습니다: " +
               "{{#if commentContent}}\"{{commentContent}}\"{{/if}}";
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of(
            "category", "comment",
            "priority", "normal",
            "actionRequired", false
        );
    }
    
    @Override
    protected int getDefaultExpirationDays() {
        return 14; // 댓글 알림은 14일 후 만료
    }
    
    @Override
    public Set<String> getSupportedContextKeys() {
        return Set.of(
            "postId",              // 게시글 ID
            "commentId",           // 댓글 ID
            "commenterId",         // 댓글 작성자 ID
            "commenterNickname",   // 댓글 작성자 닉네임
            "commentContent",      // 댓글 내용
            "linkUrl",             // 링크 URL
            "category",            // 카테고리
            "priority"             // 우선순위
        );
    }
    
    @Override
    public Set<String> getRequiredContextKeys() {
        return Set.of(
            "commenterNickname",
            "commentContent"
        );
    }
    
    @Override
    protected void validateRequiredKeys(Map<String, Object> context) {
        for (String key : getRequiredContextKeys()) {
            if (!context.containsKey(key) || context.get(key) == null) {
                throw new IllegalArgumentException("Required key missing or null: " + key);
            }
        }
    }
}
