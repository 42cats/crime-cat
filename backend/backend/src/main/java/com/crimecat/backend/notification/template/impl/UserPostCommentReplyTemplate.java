package com.crimecat.backend.notification.template.impl;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.template.AbstractHandlebarsNotificationTemplate;
import com.crimecat.backend.notification.template.HandlebarsMessageRenderer;
import com.crimecat.backend.notification.template.TypedNotificationTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * 유저 포스트 댓글 답글 알림 템플릿
 * 댓글에 답글이 달렸을 때 사용
 */
@Component
public class UserPostCommentReplyTemplate extends AbstractHandlebarsNotificationTemplate implements TypedNotificationTemplate {
    
    public UserPostCommentReplyTemplate(HandlebarsMessageRenderer handlebarsMessageRenderer) {
        super(handlebarsMessageRenderer);
    }
    
    @Override
    public NotificationType getNotificationType() {
        return NotificationType.USER_POST_COMMENT_REPLY;
    }
    
    @Override
    protected String getTitleTemplate() {
        return "{{replierNickname}}님이 답글을 남겼습니다";
    }
    
    @Override
    protected String getMessageTemplate() {
        return "{{replierNickname}}님이 회원님의 댓글에 답글을 남겼습니다: " +
               "{{#if replyContent}}\"{{replyContent}}\"{{/if}}";
    }
    
    @Override
    public Map<String, Object> getDefaultData() {
        return Map.of(
            "category", "comment_reply",
            "priority", "normal",
            "actionRequired", false
        );
    }
    
    @Override
    protected int getDefaultExpirationDays() {
        return 14; // 답글 알림은 14일 후 만료
    }
    
    @Override
    public Set<String> getSupportedContextKeys() {
        return Set.of(
            "postId",              // 게시글 ID (선택적)
            "themeId",             // 테마 ID (선택적)
            "parentCommentId",     // 부모 댓글 ID
            "replyId",             // 답글 ID
            "replierId",           // 답글 작성자 ID
            "replierNickname",     // 답글 작성자 닉네임
            "replyContent",        // 답글 내용
            "linkUrl",             // 링크 URL
            "category",            // 카테고리
            "priority"             // 우선순위
        );
    }
    
    @Override
    public Set<String> getRequiredContextKeys() {
        return Set.of(
            "replierNickname",
            "replyContent"
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
