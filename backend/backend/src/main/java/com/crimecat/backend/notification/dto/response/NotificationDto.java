package com.crimecat.backend.notification.dto.response;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.dto.form.FormBuilder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 알림 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    
    // 동적으로 생성되는 폼과 액션
    private List<FormField> formFields;
    private List<ActionButton> actionButtons;
    
    /**
     * static factory method (기본)
     */
    public static NotificationDto from(UUID id, NotificationType type, String title, String message,
                                      NotificationStatus status, LocalDateTime createdAt, 
                                      LocalDateTime expiresAt) {
        return NotificationDto.builder()
            .id(id)
            .type(type)
            .title(title)
            .message(message)
            .status(status)
            .createdAt(createdAt)
            .expiresAt(expiresAt)
            .build();
    }
    
    /**
     * Notification 엔티티로부터 DTO 생성 (FormBuilder와 함께)
     */
    public static NotificationDto from(Notification notification, FormBuilder formBuilder) {
        NotificationDto dto = NotificationDto.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .status(notification.getStatus())
            .createdAt(notification.getCreatedAt())
            .expiresAt(notification.getExpiresAt())
            .build();
            
        // 폼 필드와 액션 버튼 동적 생성
        List<FormField> formFields = formBuilder.buildFormForNotification(notification.getType(), notification.getId());
        List<ActionButton> actionButtons = formBuilder.buildActionsForNotification(notification.getType(), notification.getId());
        
        return dto.withFormAndActions(formFields, actionButtons);
    }
    
    /**
     * 폼 필드와 액션 버튼 추가
     */
    public NotificationDto withFormAndActions(List<FormField> formFields, List<ActionButton> actionButtons) {
        this.formFields = formFields;
        this.actionButtons = actionButtons;
        return this;
    }
}