package com.crimecat.backend.notification.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 이벤트 발행을 위한 유틸리티 클래스
 * 다른 서비스에서 알림 이벤트를 쉽게 발행할 수 있도록 지원
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * 게임 기록 요청 이벤트 발행
     */
    public CompletableFuture<Void> publishGameRecordRequest(Object source, UUID gameThemeId, 
                                                           String gameThemeTitle, UUID requesterId, 
                                                           UUID receiverId, String requestMessage, String requesterNickname) {
        return CompletableFuture.runAsync(() -> {
            GameRecordRequestEvent event = GameRecordRequestEvent.of(source, gameThemeId, gameThemeTitle, 
                                                                     requesterId, receiverId, requestMessage, requesterNickname);
            eventPublisher.publishEvent(event);
            log.debug("Published GameRecordRequestEvent: {}", event.getEventId());
        });
    }
    

    /**
     * 새 테마 이벤트 발행 (단일 사용자)
     */
    public CompletableFuture<Void> publishNewTheme(Object source, UUID themeId, String themeTitle, 
                                                  String themeCategory, UUID authorId, String authorNickname, 
                                                  UUID targetUserId) {
        return CompletableFuture.runAsync(() -> {
            NewThemeEvent event = NewThemeEvent.forUser(source, themeId, themeTitle, themeCategory, 
                                                        authorId, authorNickname, targetUserId);
            eventPublisher.publishEvent(event);
            log.debug("Published NewThemeEvent for single user: {}", event.getEventId());
        });
    }
    
    /**
     * 새 테마 이벤트 발행 (다중 사용자)
     */
    public CompletableFuture<Void> publishNewTheme(Object source, UUID themeId, String themeTitle, 
                                                  String themeCategory, UUID authorId, String authorNickname, 
                                                  List<UUID> targetUserIds) {
        return CompletableFuture.runAsync(() -> {
            NewThemeEvent event = NewThemeEvent.of(source, themeId, themeTitle, themeCategory, 
                                                  authorId, authorNickname, targetUserIds);
            eventPublisher.publishEvent(event);
            log.debug("Published NewThemeEvent for {} users: {}", targetUserIds.size(), event.getEventId());
        });
    }
    
    /**
     * 게임 기록 응답 이벤트 발행 (승인)
     */
    public CompletableFuture<Void> publishGameRecordApproved(Object source, UUID originalRequestId, 
                                                            UUID gameThemeId, UUID requesterId, 
                                                            UUID responderId, String gameThemeTitle) {
        return CompletableFuture.runAsync(() -> {
            GameRecordResponseEvent event = GameRecordResponseEvent.approved(source, originalRequestId, 
                                                                            gameThemeId, requesterId, responderId, gameThemeTitle);
            eventPublisher.publishEvent(event);
            log.debug("Published GameRecordResponseEvent (approved): {}", event.getEventId());
        });
    }
    
    /**
     * 게임 기록 응답 이벤트 발행 (거절)
     */
    public CompletableFuture<Void> publishGameRecordRejected(Object source, UUID originalRequestId, 
                                                            UUID gameThemeId, UUID requesterId, 
                                                            UUID responderId, String reason, String gameThemeTitle) {
        return CompletableFuture.runAsync(() -> {
            GameRecordResponseEvent event = GameRecordResponseEvent.rejected(source, originalRequestId, 
                                                                            gameThemeId, requesterId, responderId, reason, gameThemeTitle);
            eventPublisher.publishEvent(event);
            log.debug("Published GameRecordResponseEvent (rejected): {}", event.getEventId());
        });
    }
    
    /**
     * 시스템 알림 이벤트 발행 (일반)
     */
    public CompletableFuture<Void> publishSystemNotification(Object source, UUID receiverId, 
                                                           String title, String message) {
        return CompletableFuture.runAsync(() -> {
            SystemNotificationEvent event = SystemNotificationEvent.general(source, receiverId, title, message);
            eventPublisher.publishEvent(event);
            log.debug("Published SystemNotificationEvent (general): {}", event.getEventId());
        });
    }
    
    /**
     * 시스템 알림 이벤트 발행 (긴급)
     */
    public CompletableFuture<Void> publishUrgentSystemNotification(Object source, UUID receiverId, 
                                                                  String title, String message) {
        return CompletableFuture.runAsync(() -> {
            SystemNotificationEvent event = SystemNotificationEvent.urgent(source, receiverId, title, message);
            eventPublisher.publishEvent(event);
            log.debug("Published SystemNotificationEvent (urgent): {}", event.getEventId());
        });
    }
    
    /**
     * 점검 안내 이벤트 발행
     */
    public CompletableFuture<Void> publishMaintenanceNotification(Object source, UUID receiverId, String message) {
        return CompletableFuture.runAsync(() -> {
            SystemNotificationEvent event = SystemNotificationEvent.maintenance(source, receiverId, message);
            eventPublisher.publishEvent(event);
            log.debug("Published SystemNotificationEvent (maintenance): {}", event.getEventId());
        });
    }
    
    /**
     * 업데이트 안내 이벤트 발행
     */
    public CompletableFuture<Void> publishUpdateNotification(Object source, UUID receiverId, 
                                                           String title, String message) {
        return CompletableFuture.runAsync(() -> {
            SystemNotificationEvent event = SystemNotificationEvent.update(source, receiverId, title, message);
            eventPublisher.publishEvent(event);
            log.debug("Published SystemNotificationEvent (update): {}", event.getEventId());
        });
    }
    
    /**
     * 유저 포스트 댓글 이벤트 발행
     */
    public CompletableFuture<Void> publishUserPostCommented(Object source, UUID postAuthorId, UUID commentId, 
                                                           String commentContent, UUID postId, UUID commenterId, 
                                                           String commenterNickname) {
        return CompletableFuture.runAsync(() -> {
            UserPostCommentedEvent event = UserPostCommentedEvent.of(source, postAuthorId, commentId, 
                                                                    commentContent, postId, commenterId, commenterNickname, null);
            eventPublisher.publishEvent(event);
            log.debug("Published UserPostCommentedEvent: {}", event.getEventId());
        });
    }
    
    /**
     * 유저 포스트 댓글 이벤트 발행 (BoardType 포함)
     */
    public CompletableFuture<Void> publishUserPostCommented(Object source, UUID postAuthorId, UUID commentId, 
                                                           String commentContent, UUID postId, UUID commenterId, 
                                                           String commenterNickname, String boardType) {
        return CompletableFuture.runAsync(() -> {
            UserPostCommentedEvent event = UserPostCommentedEvent.of(source, postAuthorId, commentId, 
                                                                    commentContent, postId, commenterId, 
                                                                    commenterNickname, boardType);
            eventPublisher.publishEvent(event);
            log.debug("Published UserPostCommentedEvent with boardType: {}", event.getEventId());
        });
    }
    
    /**
     * 유저 포스트 댓글 답글 이벤트 발행
     */
    public CompletableFuture<Void> publishUserPostCommentReplied(Object source, UUID parentCommentAuthorId, 
                                                                UUID replyId, String replyContent, UUID parentCommentId, 
                                                                UUID postId, UUID replierId, String replierNickname) {
        return CompletableFuture.runAsync(() -> {
            UserPostCommentRepliedEvent event = UserPostCommentRepliedEvent.of(source, parentCommentAuthorId, 
                                                                              replyId, replyContent, parentCommentId, 
                                                                              postId, replierId, replierNickname, null);
            eventPublisher.publishEvent(event);
            log.debug("Published UserPostCommentRepliedEvent: {}", event.getEventId());
        });
    }
    
    /**
     * 유저 포스트 댓글 답글 이벤트 발행 (BoardType 포함)
     */
    public CompletableFuture<Void> publishUserPostCommentReplied(Object source, UUID parentCommentAuthorId, 
                                                                UUID replyId, String replyContent, UUID parentCommentId, 
                                                                UUID postId, UUID replierId, String replierNickname, String boardType) {
        return CompletableFuture.runAsync(() -> {
            UserPostCommentRepliedEvent event = UserPostCommentRepliedEvent.of(source, parentCommentAuthorId, 
                                                                              replyId, replyContent, parentCommentId, 
                                                                              postId, replierId, replierNickname, boardType);
            eventPublisher.publishEvent(event);
            log.debug("Published UserPostCommentRepliedEvent with boardType: {}", event.getEventId());
        });
    }
    
    /**
     * 게임 테마 댓글 이벤트 발행 (다중 수신자)
     */
    public CompletableFuture<Void> publishGameThemeCommented(Object source, List<UUID> targetUserIds, UUID themeId,
                                                            String themeTitle, String themeType, UUID commentId,
                                                            String commentContent, UUID commenterId, String commenterNickname) {
        return CompletableFuture.runAsync(() -> {
            GameThemeCommentedEvent event = GameThemeCommentedEvent.of(source, targetUserIds, themeId, themeTitle,
                                                                      themeType, commentId, commentContent,
                                                                      commenterId, commenterNickname);
            eventPublisher.publishEvent(event);
            log.debug("Published GameThemeCommentedEvent for {} users: {}", targetUserIds.size(), event.getEventId());
        });
    }
    
    /**
     * 게임 테마 댓글 답글 이벤트 발행
     */
    public CompletableFuture<Void> publishGameThemeCommentReplied(Object source, UUID parentCommentAuthorId,
                                                                 UUID themeId, String themeTitle, String themeType,
                                                                 UUID replyId, String replyContent, UUID parentCommentId,
                                                                 UUID replierId, String replierNickname) {
        return CompletableFuture.runAsync(() -> {
            GameThemeCommentRepliedEvent event = GameThemeCommentRepliedEvent.of(source, parentCommentAuthorId,
                                                                                themeId, themeTitle, themeType,
                                                                                replyId, replyContent, parentCommentId,
                                                                                replierId, replierNickname);
            eventPublisher.publishEvent(event);
            log.debug("Published GameThemeCommentRepliedEvent: {}", event.getEventId());
        });
    }
    
    /**
     * 이벤트 발행 (제네릭)
     * 커스텀 이벤트나 특별한 처리가 필요한 경우 사용
     */
    public CompletableFuture<Void> publishEvent(NotificationEvent event) {
        return CompletableFuture.runAsync(() -> {
            eventPublisher.publishEvent(event);
            log.debug("Published custom NotificationEvent: {}", event.getEventId());
        });
    }
}
