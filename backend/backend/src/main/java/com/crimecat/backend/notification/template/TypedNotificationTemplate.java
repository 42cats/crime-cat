package com.crimecat.backend.notification.template;

import com.crimecat.backend.notification.enums.NotificationType;

/**
 * 특정 알림 타입과 연결된 템플릿 인터페이스
 * 템플릿 레지스트리에서 자동 등록을 위해 사용
 */
public interface TypedNotificationTemplate extends NotificationTemplate {
    
    /**
     * 이 템플릿이 처리하는 알림 타입 반환
     * @return 알림 타입
     */
    NotificationType getNotificationType();
}
