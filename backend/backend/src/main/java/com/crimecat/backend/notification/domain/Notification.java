package com.crimecat.backend.notification.domain;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.utils.JsonUtil;
import com.crimecat.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder(access = AccessLevel.PRIVATE)
@EntityListeners(AuditingEntityListener.class)
public class Notification {
    @Id
    @UuidGenerator
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;
    
    // User 엔티티와의 관계 설정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(name = "data_json", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dataJson;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.UNREAD;
    
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    /**
     * 기본 알림 생성 (User 객체 사용)
     */
    public static Notification from(NotificationType type, User user, String title, 
                                   String message, Object data) {
        return Notification.builder()
            .type(type)
            .user(user)
            .title(title)
            .message(message)
            .dataJson(JsonUtil.toJson(data))
            .build();
    }
    
    /**
     * 기본 알림 생성 (UUID 사용 - 하위 호환성)
     */
    public static Notification from(NotificationType type, UUID userId, String title, 
                                   String message, Object data) {
        return Notification.builder()
            .type(type)
            .user(User.builder().id(userId).build()) // 프록시 객체
            .title(title)
            .message(message)
            .dataJson(JsonUtil.toJson(data))
            .build();
    }
    
    /**
     * 만료시간이 있는 알림 생성 (User 객체 사용)
     */
    public static Notification from(NotificationType type, User user, String title, 
                                   String message, Object data, LocalDateTime expiresAt) {
        return Notification.builder()
            .type(type)
            .user(user)
            .title(title)
            .message(message)
            .dataJson(JsonUtil.toJson(data))
            .expiresAt(expiresAt)
            .build();
    }
    
    /**
     * 만료시간이 있는 알림 생성 (UUID 사용 - 하위 호환성)
     */
    public static Notification from(NotificationType type, UUID userId, String title, 
                                   String message, Object data, LocalDateTime expiresAt) {
        return Notification.builder()
            .type(type)
            .user(User.builder().id(userId).build()) // 프록시 객체
            .title(title)
            .message(message)
            .dataJson(JsonUtil.toJson(data))
            .expiresAt(expiresAt)
            .build();
    }
    
    /**
     * 사용자 ID 가져오기 (하위 호환성)
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
    
    /**
     * 데이터 필드 추출 (타입 안전)
     */
    public <T> T getDataField(String fieldName, Class<T> targetClass) {
        return JsonUtil.getField(this.dataJson, fieldName, targetClass);
    }
    
    /**
     * 데이터 필드 추출 (문자열)
     */
    public String getDataField(String fieldName) {
        return getDataField(fieldName, String.class);
    }
    
    /**
     * 상태 변경 (Setter)
     */
    public void setStatus(NotificationStatus status) {
        this.status = status;
    }
    
    /**
     * 업데이트 시간 변경 (Setter)
     */
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    /**
     * 읽음 처리
     */
    public void markAsRead() {
        this.status = NotificationStatus.READ;
    }
    
    /**
     * 처리됨 상태로 변경
     */
    public void markAsProcessed() {
        this.status = NotificationStatus.PROCESSED;
    }
}
