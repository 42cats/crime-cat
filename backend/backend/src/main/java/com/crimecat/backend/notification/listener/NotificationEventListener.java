package com.crimecat.backend.notification.listener;

import com.crimecat.backend.notification.builder.NotificationBuilders;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.notification.event.*;
import java.util.concurrent.CompletableFuture;
import java.util.UUID;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.exception.ErrorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 알림 이벤트를 수신하고 처리하는 리스너
 * 모든 알림 이벤트를 비동기로 처리하여 성능 최적화
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {
    
    private final NotificationBuilders builders;
    private final NotificationEventPublisher eventPublisher;
    private final WebUserRepository webUserRepository;
    
    /**
     * 게임 기록 요청 이벤트 처리
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleGameRecordRequest(GameRecordRequestEvent event) {
        log.info("Processing GameRecordRequestEvent: {}", event.getEventId());
        
        try {
            // WebUser ID를 User ID로 변환
            UUID requesterUserId = convertWebUserIdToUserId(event.getRequesterId());
            UUID receiverUserId = convertWebUserIdToUserId(event.getReceiverId());
            
            // 1. 게임 기록 요청 알림 생성 (User ID 사용)
            builders.gameRecordRequest(event.getGameThemeId(), requesterUserId, receiverUserId)
                .data("requesterNickname", event.getData().get("requesterNickname"))
                .data("gameThemeTitle", event.getGameThemeTitle()) 
                .data("requestMessage", event.getRequestMessage())
                .expiresAt(event.getExpiresAt())
                .send();
            
            // 2. 요청자에게 확인 알림 발송 (User ID 사용)
            eventPublisher.publishSystemNotification(
                this,
                requesterUserId,  // 요청자에게 발송 (User ID)
                event.getGameThemeTitle() + " 기록 요청 성공",
                "기록 요청이 해당 테마의 오너에게 발송되었습니다. 승인을 기다려주세요."
            );
            
            log.debug("Successfully processed GameRecordRequestEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing GameRecordRequestEvent: {}", event.getEventId(), e);
            throw e; // 에러 전파로 재시도 가능하도록
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * WebUser ID를 User ID로 변환하는 헬퍼 메서드
     */
    private UUID convertWebUserIdToUserId(UUID webUserId) {
        if (webUserId == null) {
            throw new IllegalArgumentException("WebUser ID cannot be null");
        }
        
        WebUser webUser = webUserRepository.findById(webUserId)
            .orElseThrow(() -> ErrorStatus.USER_NOT_FOUND.asServiceException());
        
        if (webUser.getUser() == null) {
            throw ErrorStatus.USER_NOT_FOUND.asServiceException();
        }
        
        UUID userId = webUser.getUser().getId();
        log.debug("Converted WebUser ID {} to User ID {}", webUserId, userId);
        
        return userId;
    }

    
    /**
     * 새 테마 발행 이벤트 처리
     * 다중 수신자에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleNewTheme(NewThemeEvent event) {
        log.info("Processing NewThemeEvent: {} for {} users", event.getEventId(), event.getTargetUserIds().size());
        
        try {
            // 각 대상 사용자에게 알림 발송
            event.getTargetUserIds().parallelStream().forEach(userId -> {
                try {
                    builders.newTheme(event.getThemeId(), event.getAuthorId())
                        .to(userId)
                        .withThemeTitle(event.getThemeTitle())
                        .withCategory(event.getThemeCategory())
                        .title(event.getTitle())
                        .message(event.getMessage())
                        .send();
                } catch (Exception e) {
                    log.error("Error sending new theme notification to user {}: {}", userId, e.getMessage());
                }
            });
            
            log.debug("Successfully processed NewThemeEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing NewThemeEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 게임 기록 응답 이벤트 처리
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleGameRecordResponse(GameRecordResponseEvent event) {
        log.info("Processing GameRecordResponseEvent: {} (approved: {})", 
                 event.getEventId(), event.isApproved());
        
        try {
            builders.gameRecordResponse(event.getOriginalRequestId(), event.getReceiverId(), event.isApproved())
                .from(event.getResponderId())
                .title(event.getTitle())
                .message(event.getMessage())
                .withDetails(event.getResponseMessage())
                .send();
            
            log.debug("Successfully processed GameRecordResponseEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing GameRecordResponseEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 시스템 알림 이벤트 처리
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleSystemNotification(SystemNotificationEvent event) {
        log.info("Processing SystemNotificationEvent: {} (priority: {})", 
                 event.getEventId(), event.getPriority());
        
        try {
            var builder = builders.systemNotification(event.getReceiverId())
                .title(event.getTitle())
                .message(event.getMessage())
                .category(event.getCategory());
                
            // 우선순위에 따른 처리
            if (event.getPriority() == SystemNotificationEvent.Priority.URGENT || 
                event.getPriority() == SystemNotificationEvent.Priority.HIGH) {
                builder.urgent();
            } else {
                builder.normal();
            }
            
            builder.send();
            
            log.debug("Successfully processed SystemNotificationEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing SystemNotificationEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 유저 포스트 생성 이벤트 처리
     * 팔로워들에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleUserPostCreated(UserPostCreatedEvent event) {
        log.info("Processing UserPostCreatedEvent: {} for {} followers", 
                 event.getEventId(), event.getFollowerIds().size());
        
        try {
            // 각 팔로워에게 알림 발송
            event.getFollowerIds().parallelStream().forEach(followerId -> {
                try {
                    builders.userPostNew(event.getPostId(), event.getAuthorId())
                        .to(followerId)
                        .title(event.getTitle())
                        .message(event.getMessage())
                        .data("postId", event.getPostId())
                        .data("authorNickname", event.getAuthorNickname())
                        .data("linkUrl", event.getData().get("linkUrl"))
                        .send();
                } catch (Exception e) {
                    log.error("Error sending user post notification to follower {}: {}", followerId, e.getMessage());
                }
            });
            
            log.debug("Successfully processed UserPostCreatedEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing UserPostCreatedEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 유저 포스트 댓글 이벤트 처리
     * 포스트 작성자에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleUserPostCommented(UserPostCommentedEvent event) {
        log.info("Processing UserPostCommentedEvent: {}", event.getEventId());
        
        try {
            builders.userPostComment(event.getPostId(), event.getCommenterId())
                .to(event.getReceiverId())
                .title(event.getTitle())
                .message(event.getMessage())
                .data("commentId", event.getCommentId())
                .data("postId", event.getPostId())
                .data("commenterNickname", event.getCommenterNickname())
                .data("linkUrl", event.getData().get("linkUrl"))
                .send();
            
            log.debug("Successfully processed UserPostCommentedEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing UserPostCommentedEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 유저 포스트 댓글 답글 이벤트 처리
     * 부모 댓글 작성자에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleUserPostCommentReplied(UserPostCommentRepliedEvent event) {
        log.info("Processing UserPostCommentRepliedEvent: {}", event.getEventId());
        
        try {
            builders.userPostCommentReply(event.getParentCommentId(), event.getReplierId())
                .to(event.getReceiverId())
                .title(event.getTitle())
                .message(event.getMessage())
                .data("replyId", event.getReplyId())
                .data("parentCommentId", event.getParentCommentId())
                .data("postId", event.getPostId())
                .data("replierNickname", event.getReplierNickname())
                .data("linkUrl", event.getData().get("linkUrl"))
                .send();
            
            log.debug("Successfully processed UserPostCommentRepliedEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing UserPostCommentRepliedEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 게임 테마 댓글 이벤트 처리
     * 크라임신의 경우 다중 사용자에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleGameThemeCommented(GameThemeCommentedEvent event) {
        log.info("Processing GameThemeCommentedEvent: {} for {} users", 
                 event.getEventId(), event.getTargetUserIds().size());
        
        try {
            // 각 대상 사용자에게 알림 발송
            event.getTargetUserIds().parallelStream().forEach(userId -> {
                try {
                    // 게임 테마를 위해 userPostComment 빌더를 사용하되, linkUrl을 덮어쓰기
                    builders.userPostComment(event.getThemeId(), event.getCommenterId())
                        .to(userId)
                        .title(event.getTitle())
                        .message(event.getMessage())
                        .data("themeId", event.getThemeId())
                        .data("themeTitle", event.getThemeTitle())
                        .data("themeType", event.getThemeType())
                        .data("commentId", event.getCommentId())
                        .data("commentContent", event.getCommentContent())
                        .data("commenterNickname", event.getCommenterNickname())
                        .data("linkUrl", event.getData().get("linkUrl")) // 이벤트에서 제공한 linkUrl로 덮어쓰기
                        .send();
                } catch (Exception e) {
                    log.error("Error sending game theme comment notification to user {}: {}", userId, e.getMessage());
                }
            });
            
            log.debug("Successfully processed GameThemeCommentedEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing GameThemeCommentedEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 게임 테마 댓글 답글 이벤트 처리
     * 부모 댓글 작성자에게 알림 발송
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleGameThemeCommentReplied(GameThemeCommentRepliedEvent event) {
        log.info("Processing GameThemeCommentRepliedEvent: {}", event.getEventId());
        
        try {
            builders.userPostCommentReply(event.getParentCommentId(), event.getReplierId())
                .to(event.getReceiverId())
                .title(event.getTitle())
                .message(event.getMessage())
                .data("themeId", event.getThemeId())
                .data("themeTitle", event.getThemeTitle())
                .data("themeType", event.getThemeType())
                .data("replyId", event.getReplyId())
                .data("replyContent", event.getReplyContent())
                .data("parentCommentId", event.getParentCommentId())
                .data("replierNickname", event.getReplierNickname())
                .data("linkUrl", event.getData().get("linkUrl"))
                .send();
            
            log.debug("Successfully processed GameThemeCommentRepliedEvent: {}", event.getEventId());
        } catch (Exception e) {
            log.error("Error processing GameThemeCommentRepliedEvent: {}", event.getEventId(), e);
            throw e;
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * 모든 알림 이벤트에 대한 공통 처리
     * 로깅, 메트릭 수집 등의 작업 수행
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleAllNotificationEvents(NotificationEvent event) {
        log.trace("Processing notification event: {} - {}", event.getClass().getSimpleName(), event.getEventId());
        
        // 메트릭 수집 (예시)
        // meterRegistry.counter("notification.events", "type", event.getClass().getSimpleName()).increment();
        
        // 감사 로그 (예시)
        log.info("Notification event processed: type={}, receiver={}, sender={}, eventId={}", 
                 event.getClass().getSimpleName(), 
                 event.getReceiverId(), 
                 event.getSenderId(), 
                 event.getEventId());
        
        return CompletableFuture.completedFuture(null);
    }
}
