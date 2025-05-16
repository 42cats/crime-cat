package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.user.domain.User;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 생성을 위한 추상 빌더 클래스
 * 체이닝 패턴을 통해 직관적인 알림 생성을 제공
 */
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class NotificationBuilder {
    protected final NotificationService notificationService;
    protected final NotificationType type;
    
    // 필수 필드
    protected UUID receiverId;
    protected UUID senderId;
    protected String title;
    protected String message;
    
    // 선택적 필드
    protected Map<String, Object> data = new HashMap<>();
    protected LocalDateTime expiresAt;
    
    /**
     * 수신자 설정
     */
    public NotificationBuilder to(UUID receiverId) {
        this.receiverId = receiverId;
        return this;
    }
    
    /**
     * 수신자 설정 (User 객체)
     */
    public NotificationBuilder to(User receiver) {
        return to(receiver.getId());
    }
    
    /**
     * 발신자 설정
     */
    public NotificationBuilder from(UUID senderId) {
        this.senderId = senderId;
        return this;
    }
    
    /**
     * 발신자 설정 (User 객체)
     */
    public NotificationBuilder from(User sender) {
        return from(sender.getId());
    }
    
    /**
     * 제목 설정
     */
    public NotificationBuilder title(String title) {
        this.title = title;
        return this;
    }
    
    /**
     * 메시지 설정
     */
    public NotificationBuilder message(String message) {
        this.message = message;
        return this;
    }
    
    /**
     * 만료시간 설정
     */
    public NotificationBuilder expiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
        return this;
    }
    
    /**
     * 데이터 필드 추가
     */
    public NotificationBuilder data(String key, Object value) {
        this.data.put(key, value);
        return this;
    }
    
    /**
     * 데이터 맵 전체 설정
     */
    public NotificationBuilder data(Map<String, Object> data) {
        this.data.putAll(data);
        return this;
    }
    
    /**
     * 알림 생성 및 발송
     * 각 구현체에서 고유한 로직 수행 후 실제 발송
     */
    public UUID send() {
        // 하위 클래스에서 특화된 로직 수행
        prepareNotification();
        
        // 공통 검증
        validate();
        
        // 실제 알림 생성 및 발송
        return notificationService.createAndSendNotification(
            type, receiverId, senderId, title, message, data
        );
    }
    
    /**
     * 하위 클래스에서 구현하여 특화된 준비 로직 수행
     */
    protected abstract void prepareNotification();
    
    /**
     * 기본 검증 로직
     */
    protected void validate() {
        if (receiverId == null) {
            throw new IllegalArgumentException("Receiver ID is required");
        }
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message is required");
        }
    }
}
