package com.crimecat.backend.notification.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 이벤트의 기본 클래스
 * 모든 알림 관련 이벤트가 이 클래스를 상속받아 구현
 */
@Getter
@Setter
public abstract class NotificationEvent extends ApplicationEvent {
    
    // 수신자 정보
    private final UUID receiverId;
    
    // 발신자 정보 (선택적)
    private final UUID senderId;
    
    // 알림 제목
    private String title;
    
    // 알림 메시지
    private String message;
    
    // 추가 데이터
    private Map<String, Object> data = new HashMap<>();
    
    // 이벤트 발생 시간
    private final LocalDateTime eventTime;
    
    // 만료 시간 (선택적)
    private LocalDateTime expiresAt;
    
    protected NotificationEvent(Object source, UUID receiverId, UUID senderId) {
        super(source);
        this.receiverId = receiverId;
        this.senderId = senderId;
        this.eventTime = LocalDateTime.now();
    }
    
    protected NotificationEvent(Object source, UUID receiverId) {
        this(source, receiverId, null);
    }
    
    /**
     * 데이터 추가
     */
    public NotificationEvent withData(String key, Object value) {
        this.data.put(key, value);
        return this;
    }
    
    /**
     * 제목 설정
     */
    public NotificationEvent withTitle(String title) {
        this.title = title;
        return this;
    }
    
    /**
     * 메시지 설정
     */
    public NotificationEvent withMessage(String message) {
        this.message = message;
        return this;
    }
    
    /**
     * 만료 시간 설정
     */
    public NotificationEvent withExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
        return this;
    }
    
    /**
     * 각 이벤트별 고유 식별자 (로깅 및 추적용)
     */
    public String getEventId() {
        return this.getClass().getSimpleName() + "_" + System.currentTimeMillis();
    }
    
    /**
     * 이벤트 메타데이터 추출
     */
    public Map<String, Object> getMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("eventId", getEventId());
        metadata.put("eventTime", eventTime);
        metadata.put("receiverId", receiverId);
        metadata.put("senderId", senderId);
        metadata.put("expiresAt", expiresAt);
        return metadata;
    }
}
