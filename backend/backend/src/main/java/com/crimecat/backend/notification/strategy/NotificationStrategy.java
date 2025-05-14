package com.crimecat.backend.notification.strategy;

import com.crimecat.backend.notification.dto.form.ActionButton;
import com.crimecat.backend.notification.dto.form.FormField;
import com.crimecat.backend.notification.enums.NotificationType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 전략 인터페이스
 * 알림 타입별로 다른 폼 구성과 액션 처리를 위한 전략 패턴
 */
public interface NotificationStrategy {
    
    /**
     * 알림에 표시될 폼 필드들을 생성합니다.
     *
     * @param notificationId 알림 ID
     * @param data 알림별 특화 데이터 (JSON 형태)
     * @return 폼 필드 리스트
     */
    List<FormField> buildFormFields(UUID notificationId, String data);
    
    /**
     * 알림에 표시될 액션 버튼들을 생성합니다.
     *
     * @param notificationId 알림 ID
     * @param data 알림별 특화 데이터 (JSON 형태)
     * @return 액션 버튼 리스트
     */
    List<ActionButton> buildActionButtons(UUID notificationId, String data);
    
    /**
     * 이 전략이 지원하는 알림 타입인지 확인합니다.
     *
     * @param type 알림 타입
     * @return 지원하면 true, 그렇지 않으면 false
     */
    boolean supports(NotificationType type);
    
    /**
     * 액션 처리를 담당합니다.
     * 각 알림 타입별로 다른 비즈니스 로직을 수행합니다.
     *
     * @param notificationId 처리할 알림 ID
     * @param actionType 수행할 액션 타입 (ACCEPT, DECLINE 등)
     * @param actionData 액션 수행에 필요한 데이터
     */
    void handleAction(UUID notificationId, String actionType, Map<String, Object> actionData);
}
