package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * 다양한 알림 빌더를 생성하는 팩토리 클래스
 * 각 알림 타입별로 특화된 빌더를 제공
 * 제네릭 빌더를 반환하여 타입 안전성 보장
 */
@Component
@RequiredArgsConstructor
public class NotificationBuilders {
    
    private final NotificationService notificationService;
    private final TemplateService templateService;
    
    /**
     * 게임 기록 요청 알림 빌더 생성
     * @param gameThemeId 게임 테마 ID
     * @param requesterId 요청자 ID
     * @param receiverId 수신자 ID (게임 기록 관리자)
     * @return GameRecordRequestBuilder
     */
    public GameRecordRequestBuilder gameRecordRequest(UUID gameThemeId, UUID requesterId, UUID receiverId) {
        return new GameRecordRequestBuilder(notificationService, templateService, gameThemeId, requesterId)
                .to(receiverId)
                .from(requesterId);
    }
    
    /**
     * 친구 요청 알림 빌더 생성
     * @param requesterId 요청자 ID
     * @param receiverId 수신자 ID
     * @return FriendRequestBuilder
     */
    public FriendRequestBuilder friendRequest(UUID requesterId, UUID receiverId) {
        return new FriendRequestBuilder(notificationService, templateService)
                .to(receiverId)
                .from(requesterId);
    }
    
    /**
     * 새 테마 알림 빌더 생성
     * @param themeId 새로운 테마 ID
     * @param authorId 테마 작성자 ID
     * @return NewThemeBuilder
     */
    public NewThemeBuilder newTheme(UUID themeId, UUID authorId) {
        return new NewThemeBuilder(notificationService, templateService, themeId, authorId)
                .from(authorId);
    }
    
    /**
     * 시스템 알림 빌더 생성
     * @param receiverId 수신자 ID
     * @return SystemNotificationBuilder
     */
    public SystemNotificationBuilder systemNotification(UUID receiverId) {
        return new SystemNotificationBuilder(notificationService, templateService)
                .to(receiverId);
    }
    
    /**
     * 게임 기록 응답 알림 빌더 생성 (승인/거절 결과)
     * @param originalRequestId 원본 요청 ID
     * @param receiverId 수신자 ID (원래 요청자)
     * @param approved 승인 여부
     * @return GameRecordResponseBuilder
     */
    public GameRecordResponseBuilder gameRecordResponse(UUID originalRequestId, UUID receiverId, boolean approved) {
        return new GameRecordResponseBuilder(notificationService, templateService, originalRequestId, approved)
                .to(receiverId);
    }
    
    /**
     * 새 유저 포스트 알림 빌더 생성
     * @param postId 포스트 ID
     * @param authorId 작성자 ID
     * @return UserPostNewBuilder
     */
    public UserPostNewBuilder userPostNew(UUID postId, UUID authorId) {
        return new UserPostNewBuilder(notificationService, templateService, postId, authorId)
                .from(authorId);
    }
    
    /**
     * 유저 포스트 댓글 알림 빌더 생성
     * @param postId 포스트 ID
     * @param commenterId 댓글 작성자 ID
     * @return UserPostCommentBuilder
     */
    public UserPostCommentBuilder userPostComment(UUID postId, UUID commenterId) {
        return new UserPostCommentBuilder(notificationService, templateService, postId, commenterId)
                .from(commenterId);
    }
    
    /**
     * 유저 포스트 댓글 답글 알림 빌더 생성
     * @param parentCommentId 부모 댓글 ID
     * @param replierId 답글 작성자 ID
     * @return UserPostCommentReplyBuilder
     */
    public UserPostCommentReplyBuilder userPostCommentReply(UUID parentCommentId, UUID replierId) {
        return new UserPostCommentReplyBuilder(notificationService, templateService, parentCommentId, replierId)
                .from(replierId);
    }
}
