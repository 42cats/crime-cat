package com.crimecat.backend.notification.service;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.strategy.NotificationStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 전략을 관리하는 서비스
 * 알림 타입에 따라 적절한 전략을 선택하여 폼과 버튼을 구성
 */
@Service
@RequiredArgsConstructor
public class NotificationStrategyService {
    
    private final List<NotificationStrategy> strategies;
    
    /**
     * 주어진 알림 타입에 대한 폼 필드들을 생성합니다.
     *
     * @param type 알림 타입
     * @param notificationId 알림 ID
     * @param data 알림 데이터
     * @return 폼 필드 리스트
     */
    public List<FormField> buildFormFields(NotificationType type, UUID notificationId, String data) {
        NotificationStrategy strategy = findStrategy(type);
        return strategy.buildFormFields(notificationId, data);
    }
    
    /**
     * 주어진 알림 타입에 대한 액션 버튼들을 생성합니다.
     *
     * @param type 알림 타입
     * @param notificationId 알림 ID
     * @param data 알림 데이터
     * @return 액션 버튼 리스트
     */
    public List<ActionButton> buildActionButtons(NotificationType type, UUID notificationId, String data) {
        NotificationStrategy strategy = findStrategy(type);
        return strategy.buildActionButtons(notificationId, data);
    }
    
    /**
     * 알림 액션을 처리합니다.
     *
     * @param type 알림 타입
     * @param notificationId 알림 ID
     * @param actionType 액션 타입
     * @param actionData 액션 데이터
     */
    public void handleAction(NotificationType type, UUID notificationId, 
                           String actionType, Map<String, Object> actionData) {
        NotificationStrategy strategy = findStrategy(type);
        strategy.handleAction(notificationId, actionType, actionData);
    }
    
    /**
     * 주어진 알림 타입에 대한 전략을 찾습니다.
     *
     * @param type 알림 타입
     * @return 해당하는 전략
     * @throws IllegalArgumentException 지원하지 않는 알림 타입인 경우
     */
    private NotificationStrategy findStrategy(NotificationType type) {
        return strategies.stream()
                .filter(strategy -> strategy.supports(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "지원하지 않는 알림 타입입니다: " + type));
    }
}
