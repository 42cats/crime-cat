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
 * 기록 요청 알림 전략
 * 게임 기록 요청에 대한 승인/거절 처리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecordRequestNotification implements NotificationStrategy {
    
    private final JsonUtil jsonUtil;
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        return Arrays.asList(
            HiddenField.builder()
                .name("notificationId")
                .value(notificationId.toString())
                .build(),
            TextField.builder()
                .name("message")
                .label("응답 메시지")
                .placeholder("응답 메시지를 입력하세요")
                .required(false)
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.ACCEPT)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(true)
                .build(),
            ActionButton.builder()
                .type(ActionButtonType.DECLINE)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(true)
                .build()
        );
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.RECORD_REQUEST;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("기록 요청 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "ACCEPT":
                    handleAccept(notificationId, actionData);
                    break;
                case "DECLINE":
                    handleDecline(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("기록 요청 알림 액션 처리 실패", e);
            throw new RuntimeException("기록 요청 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleAccept(UUID notificationId, Map<String, Object> actionData) {
        String message = (String) actionData.get("message");
        log.info("기록 요청 승인: notificationId={}, message={}", notificationId, message);
        
        // TODO: 실제 기록 승인 비즈니스 로직 구현
        // 1. 기록 데이터를 공식 기록으로 전환
        // 2. 요청자에게 승인 알림 발송
        // 3. 게임 통계 업데이트
    }
    
    private void handleDecline(UUID notificationId, Map<String, Object> actionData) {
        String message = (String) actionData.get("message");
        log.info("기록 요청 거절: notificationId={}, message={}", notificationId, message);
        
        // TODO: 실제 기록 거절 비즈니스 로직 구현
        // 1. 기록 요청 상태를 거절로 변경
        // 2. 요청자에게 거절 알림 발송 (메시지 포함)
        // 3. 기록 데이터 정리
    }
}
