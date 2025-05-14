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
 * 게임 알림 전략
 * 게임 시작/종료, 특별 이벤트 등에 대한 단순 확인만 필요한 알림
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GameNotification implements NotificationStrategy {
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 게임 알림은 단순 확인만 필요하므로 숨겨진 필드만 포함
        return Collections.singletonList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        // 확인 버튼만 제공 (단순 읽음 처리)
        return Collections.singletonList(
            ActionButton.builder()
                .type(ActionButtonType.CONFIRM)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(false)
                .build()
        );
    }
    
    @Override
    public boolean supports(NotificationType type) {
        return type == NotificationType.GAME_NOTICE;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("게임 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "CONFIRM":
                    handleConfirm(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("게임 알림 액션 처리 실패", e);
            throw new RuntimeException("게임 알림 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleConfirm(UUID notificationId, Map<String, Object> actionData) {
        log.info("게임 알림 확인: notificationId={}", notificationId);
        
        // TODO: 실제 게임 알림 확인 비즈니스 로직 구현
        // 1. 알림 상태를 READ로 변경
        // 2. 필요시 게임 상태 업데이트
        // 3. 추가 게임 로직 실행 (이벤트 참여 등)
    }
}
