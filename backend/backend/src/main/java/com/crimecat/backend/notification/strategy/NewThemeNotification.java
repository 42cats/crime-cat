package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.dto.form.HiddenField;
import com.crimecat.backend.notification.enums.ActionButtonType;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.utils.JsonUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 새 게임(테마) 등록 알림 전략
 * 새로운 게임이 등록되었을 때 사용자에게 알림을 보내고 해당 게임 페이지로 이동할 수 있는 기능 제공
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NewThemeNotification implements NotificationStrategy {
    
    @Override
    public List<FormField> buildFormFields(UUID notificationId, String data) {
        // 새 게임 알림은 폼 입력이 필요하지 않으므로 숨겨진 필드만 포함
        return Collections.singletonList(
            HiddenField.builder()
                .name("notificationId")
                .defaultValue(notificationId.toString())
                .build()
        );
    }
    
    @Override
    public List<ActionButton> buildActionButtons(UUID notificationId, String data) {
        // 게임 ID 추출하여 게임 페이지 링크 생성
        String gameId = extractGameId(data);
        
        return Arrays.asList(
            ActionButton.builder()
                .type(ActionButtonType.VIEW)
                .actionUrl("/games/" + gameId)  // 게임 상세 페이지로 직접 이동
                .requiresForm(false)
                .label("게임 보기")  // 구체적인 라벨 제공
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
        log.info("새 게임 알림 액션 처리: notificationId={}, actionType={}", notificationId, actionType);
        
        try {
            switch (actionType.toUpperCase()) {
                case "VIEW":
                    handleViewGame(notificationId, actionData);
                    break;
                case "CONFIRM":
                    handleConfirm(notificationId, actionData);
                    break;
                default:
                    throw new IllegalArgumentException("지원하지 않는 액션 타입: " + actionType);
            }
        } catch (Exception e) {
            log.error("새 게임 알림 액션 처리 실패", e);
            throw new RuntimeException("새 게임 알림 처리 중 오류가 발생했습니다", e);
        }
    }
    
    private void handleViewGame(UUID notificationId, Map<String, Object> actionData) {
        log.info("게임 페이지 조회: notificationId={}", notificationId);
        
        // TODO: 실제 게임 페이지 조회 비즈니스 로직 구현
        // 1. 알림 상태를 READ로 변경
        // 2. 게임 조회 수 증가 (views++)
        // 3. 사용자 활동 로그 기록
    }
    
    private void handleConfirm(UUID notificationId, Map<String, Object> actionData) {
        log.info("새 게임 알림 확인: notificationId={}", notificationId);
        
        // TODO: 실제 게임 알림 확인 비즈니스 로직 구현
        // 1. 알림 상태를 READ로 변경
        // 2. 알림 확인 통계 업데이트
    }
    
    /**
     * 알림 데이터에서 게임 ID를 추출합니다.
     * 
     * @param data JSON 형태의 알림 데이터
     * @return 게임 ID (UUID 문자열)
     */
    private String extractGameId(String data) {
        try {
            if (data == null || data.isEmpty()) {
                log.warn("알림 데이터가 비어있습니다");
                return "";
            }
            
            // JSON 데이터에서 themeId 추출
            // 예상 구조: {"themeId": "uuid", "themeTitle": "게임 제목", ...}
            String themeId = JsonUtil.extractField(data, "themeId");
            return themeId != null ? themeId : "";
        } catch (Exception e) {
            log.error("게임 ID 추출 실패: {}", data, e);
            return "";
        }
    }
}
