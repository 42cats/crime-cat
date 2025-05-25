package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;
import com.crimecat.backend.user.domain.User;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 생성을 위한 추상 빌더 클래스
 * 제네릭을 사용하여 체이닝 시 타입 안전성 확보
 * @param <T> 실제 빌더 타입
 */
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
@Slf4j
public abstract class NotificationBuilder<T extends NotificationBuilder<T>> {
    protected final NotificationService notificationService;
    protected final TemplateService templateService;
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
     * 자기 자신의 타입으로 반환하여 체이닝 시 타입 유지
     */
    @SuppressWarnings("unchecked")
    protected T self() {
        return (T) this;
    }
    
    /**
     * 수신자 설정
     */
    public T to(UUID receiverId) {
        this.receiverId = receiverId;
        return self();
    }
    
    /**
     * 수신자 설정 (User 객체)
     */
    public T to(User receiver) {
        return to(receiver.getId());
    }
    
    /**
     * 발신자 설정
     */
    public T from(UUID senderId) {
        this.senderId = senderId;
        return self();
    }
    
    /**
     * 발신자 설정 (User 객체)
     */
    public T from(User sender) {
        return from(sender.getId());
    }
    
    /**
     * 제목 설정
     */
    public T title(String title) {
        this.title = title;
        return self();
    }
    
    /**
     * 메시지 설정
     */
    public T message(String message) {
        this.message = message;
        return self();
    }
    
    /**
     * 만료시간 설정
     */
    public T expiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
        return self();
    }
    
    /**
     * 데이터 필드 추가
     */
    public T data(String key, Object value) {
        this.data.put(key, value);
        return self();
    }
    
    /**
     * 데이터 맵 전체 설정
     */
    public T data(Map<String, Object> data) {
        this.data.putAll(data);
        return self();
    }
    
    /**
     * 템플릿을 사용하여 제목과 메시지를 자동 생성
     */
    protected void applyTemplate() {
        // 템플릿 렌더링을 위한 컨텍스트 준비
        Map<String, Object> context = new HashMap<>(data);
        context.put("receiverId", receiverId);
        context.put("senderId", senderId);
        
        // 템플릿 렌더링
        TemplateService.RenderedTemplate rendered = templateService.render(type, context);
        
        // 제목과 메시지가 명시적으로 설정되지 않은 경우에만 템플릿 적용
        if (title == null) {
            title = rendered.getTitle();
        }
        if (message == null) {
            message = rendered.getMessage();
        }
        
        // 기본 데이터 추가
        rendered.getDefaultData().forEach(data::putIfAbsent);
        
        // 만료 시간이 설정되지 않은 경우 템플릿 기본값 사용
        if (expiresAt == null) {
            expiresAt = rendered.getDefaultExpiresAt();
        }
    }
    
    /**
     * 템플릿 적용 후 하위 클래스에서 특화된 준비 로직 수행
     */
    protected abstract void prepareNotification();
    
    /**
     * 알림 생성 및 발송
     * 각 구현체에서 고유한 로직 수행 후 실제 발송
     */
    public UUID send() {
        // 1. 템플릿 적용 전 로그
        log.debug("Before applyTemplate: title={}, message={}, data={}", title, message, data);
        
        // 2. 템플릿 적용
        applyTemplate();
        
        // 3. 템플릿 적용 후 로그
        log.debug("After applyTemplate: title={}, message={}, data={}", title, message, data);
        
        // 4. 하위 클래스에서 특화된 로직 수행
        prepareNotification();
        
        // 5. 공통 검증
        validate();
        
        // 6. 실제 알림 생성 및 발송
        return notificationService.createAndSendNotification(
            type, receiverId, senderId, title, message, data
        );
    }
    
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
