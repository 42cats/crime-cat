package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.HiddenField;
import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 댓글 알림 전략
 * 댓글이 달렸다는 단순 알림 (액션 불필요)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommentAlertNotification implements NotificationStrategy {
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 댓글 알림은 단순 확인만 필요하므로 숨겨진 필드만 포함
        return Collections.singletonList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        // 댓글 알림은 액션 버튼이 없음
        // 단순히 알림만 확인하는 형태
        return Collections.emptyList();
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.COMMENT_ALERT;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("댓글 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        // 댓글 알림은 액션이 없으므로 예외 처리
        throw new IllegalArgumentException("댓글 알림은 액션 처리를 지원하지 않습니다: " + actionType);
    }
}
