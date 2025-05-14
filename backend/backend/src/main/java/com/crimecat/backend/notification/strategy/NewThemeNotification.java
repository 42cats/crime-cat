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
 * 새 테마 알림 전략
 * 새로운 테마 출시에 대한 알림 처리 (테마 적용 기능 포함)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NewThemeNotification implements NotificationStrategy {
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 새 테마 알림은 폼 입력이 필요하지 않으므로 숨겨진 필드만 포함
        return Collections.singletonList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        // 테마 적용과 확인 버튼 제공 (폼 입력 불필요)
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.APPLY_THEME)
                .actionUrl("/api/notifications/" + notificationId + "/actions")
                .requiresForm(false)
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
        return type == NotificationType.NEW_THEME;
    }
    
    @Override
    public void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData) {
        log.info("새 테마 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "APPLY_THEME":
                    handleApplyTheme(notificationId, actionData);
                    break;
                case "CONFIRM":
                    handleConfirm(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("새 테마 알림 액션 처리 실패", e);
            throw new RuntimeException("새 테마 알림 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleApplyTheme(UUID notificationId, Map<String, Object> actionData) {
        log.info("새 테마 적용: notificationId={}", notificationId);
        
        // TODO: 실제 테마 적용 비즈니스 로직 구현
        // 1. 사용자에게 새 테마 적용
        // 2. 사용자 선호 설정 업데이트
        // 3. 테마 적용 성공 알림 발송
    }
    
    private void handleConfirm(UUID notificationId, Map<String, Object> actionData) {
        log.info("새 테마 알림 확인: notificationId={}", notificationId);
        
        // TODO: 실제 테마 알림 확인 비즈니스 로직 구현
        // 1. 알림 상태를 READ로 변경
        // 2. 테마 확인 통계 업데이트
    }
}
