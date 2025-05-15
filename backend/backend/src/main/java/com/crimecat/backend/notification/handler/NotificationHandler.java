package com.crimecat.backend.notification.handler;

import com.crimecat.backend.notification.enums.NotificationType;
import java.util.Set;
import java.util.UUID;

/**
 * 알림 처리를 위한 핵심 인터페이스
 * 각 알림 타입별로 고유한 처리 로직을 구현
 */
public interface NotificationHandler {
    
    /**
     * 지원하는 알림 타입 확인
     * @param type 확인할 알림 타입
     * @return 지원 여부
     */
    boolean supports(NotificationType type);
    
    /**
     * 지원하는 액션 목록 반환
     * @return 지원하는 액션들의 집합
     */
    Set<String> getSupportedActions();
    
    /**
     * 액션 처리 (각 구현체가 자율적으로 처리)
     * @param notificationId 알림 ID
     * @param action 처리할 액션
     * @param requestBody 요청 데이터
     */
    void handleAction(UUID notificationId, String action, Object requestBody);
    
    /**
     * 유효성 검증 (선택적)
     * @param action 검증할 액션
     * @param requestBody 검증할 요청 데이터
     */
    default void validateAction(String action, Object requestBody) {
        if (!getSupportedActions().contains(action)) {
            throw new IllegalArgumentException("Unsupported action: " + action);
        }
    }
}
