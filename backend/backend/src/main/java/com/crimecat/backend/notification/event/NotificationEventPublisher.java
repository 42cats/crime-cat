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
                                                           UUID receiverId, String requestMessage) {
        return CompletableFuture.runAsync(() -> {
            GameRecordRequestEvent event = GameRecordRequestEvent.of(source, gameThemeId, gameThemeTitle, 
                                                                     requesterId, receiverId, requestMessage);
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
                                                            UUID responderId) {
        return CompletableFuture.runAsync(() -> {
            GameRecordResponseEvent event = GameRecordResponseEvent.approved(source, originalRequestId, 
                                                                            gameThemeId, requesterId, responderId);
            eventPublisher.publishEvent(event);
            log.debug("Published GameRecordResponseEvent (approved): {}", event.getEventId());
        });
    }
    
    /**
     * 게임 기록 응답 이벤트 발행 (거절)
     */
    public CompletableFuture<Void> publishGameRecordRejected(Object source, UUID originalRequestId, 
                                                            UUID gameThemeId, UUID requesterId, 
                                                            UUID responderId, String reason) {
        return CompletableFuture.runAsync(() -> {
            GameRecordResponseEvent event = GameRecordResponseEvent.rejected(source, originalRequestId, 
                                                                            gameThemeId, requesterId, responderId, reason);
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
