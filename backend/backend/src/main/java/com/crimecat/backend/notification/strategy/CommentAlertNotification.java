package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.HiddenField;
import com.crimecat.backend.notification.dto.form.TextField;
import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.utils.JsonUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 댓글 알림 전략
 * 게시글/댓글에 대한 댓글 알림 처리 (답글 작성 기능)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommentAlertNotification implements NotificationStrategy {
    
    private final JsonUtil jsonUtil;
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        return Arrays.asList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build(),
            TextField.builder()
                .name("reply")
                .label("답글")
                .required(false)
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.REPLY)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(true)
                .build(),
            ActionButton.builder()
                .type(ActionButtonType.CONFIRM)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(false)
                .build()
        );
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.COMMENT_ALERT;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("댓글 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "REPLY":
                    handleReply(notificationId, actionData);
                    break;
                case "CONFIRM":
                    handleConfirm(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("댓글 알림 액션 처리 실패", e);
            throw new RuntimeException("댓글 알림 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleReply(UUID notificationId, Map<String, Object> actionData) {
        String reply = (String) actionData.get("reply");
        log.info("댓글 답글 작성: notificationId={}, reply={}", notificationId, reply);
        
        // TODO: 실제 답글 작성 비즈니스 로직 구현
        // 1. 답글 댓글 생성
        // 2. 원 댓글 작성자에게 답글 알림 발송
        // 3. 게시글 활동 통계 업데이트
    }
    
    private void handleConfirm(UUID notificationId, Map<String, Object> actionData) {
        log.info("댓글 알림 확인: notificationId={}", notificationId);
        
        // TODO: 실제 댓글 알림 확인 비즈니스 로직 구현
        // 1. 알림 상태를 READ로 변경
        // 2. 필요시 읽음 통계 업데이트
    }
}
