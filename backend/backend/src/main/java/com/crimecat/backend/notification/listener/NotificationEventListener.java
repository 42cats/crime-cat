package com.crimecat.backend.notification.listener;

import com.crimecat.backend.notification.builder.NotificationBuilders;
import com.crimecat.backend.notification.event.NotificationEventPublisher;
import com.crimecat.backend.notification.event.*;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    
    /**
     * 게임 기록 요청 이벤트 처리
     */
    @EventListener
    @Async
    public CompletableFuture<Void> handleGameRecordRequest(GameRecordRequestEvent event) {
        log.info("Processing GameRecordRequestEvent: {}", event.getEventId());
        
        try {
            // 1. 게임 기록 요청 알림 생성
            builders.gameRecordRequest(event.getGameThemeId(), event.getRequesterId(), event.getReceiverId())
                .data("requesterNickname", event.getData().get("requesterNickname"))
                .data("gameThemeTitle", event.getGameThemeTitle()) 
                .data("requestMessage", event.getRequestMessage())
                .expiresAt(event.getExpiresAt())
                .send();
            
            // 2. 요청자에게 확인 알림 발송 (NEW!)
            eventPublisher.publishSystemNotification(
                this,
                event.getRequesterId(),  // 요청자에게 발송
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
