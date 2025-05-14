package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.HiddenField;
import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 친구 요청 알림 전략
 * 친구 요청에 대한 승인/거절 처리 (텍스트 입력 불필요)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FriendRequestNotification implements NotificationStrategy {
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 친구 요청은 별도 메시지 입력이 필요하지 않으므로 숨겨진 필드만 포함
        return Collections.singletonList(
            HiddenField.builder()
                .name("notificationId")
                .value(notificationId.toString())
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.ACCEPT)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(false)  // 폼 입력 불필요
                .build(),
            ActionButton.builder()
                .type(ActionButtonType.DECLINE)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(false)  // 폼 입력 불필요
                .build()
        );
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.FRIEND_REQUEST;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("친구 요청 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
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
            log.error("친구 요청 알림 액션 처리 실패", e);
            throw new RuntimeException("친구 요청 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleAccept(UUID notificationId, Map<String, Object> actionData) {
        log.info("친구 요청 승인: notificationId={}", notificationId);
        
        // TODO: 실제 친구 요청 승인 비즈니스 로직 구현
        // 1. 친구 관계 생성
        // 2. 요청자에게 승인 알림 발송
        // 3. 양방향 친구 관계 설정
    }
    
    private void handleDecline(UUID notificationId, Map<String, Object> actionData) {
        log.info("친구 요청 거절: notificationId={}", notificationId);
        
        // TODO: 실제 친구 요청 거절 비즈니스 로직 구현
        // 1. 친구 요청 상태를 거절로 변경
        // 2. 요청자에게 거절 알림 발송 (선택적)
        // 3. 요청 데이터 정리
    }
}
