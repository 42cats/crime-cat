package com.crimecat.backend.notification.handler;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.repository.NotificationRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.UUID;

/**
 * 알림 핸들러의 공통 기능을 제공하는 추상 클래스
 */
public abstract class AbstractNotificationHandler implements NotificationHandler {
    
    @Autowired
    protected NotificationRepository notificationRepository;
    
    @Autowired
    protected ObjectMapper objectMapper;
    
    /**
     * 공통 검증 로직
     */
    @Override
    public void validateAction(String action, Object requestBody) {
        if (!getSupportedActions().contains(action)) {
            throw ErrorStatus.INVALID_NOTIFICATION_ACTION.asServiceException();
        }
    }
    
    /**
     * 알림 조회 공통 메소드
     */
    protected Notification findNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId)
            .orElseThrow(() -> ErrorStatus.NOTIFICATION_NOT_FOUND.asServiceException());
    }
    
    /**
     * Request Body를 특정 타입으로 변환
     */
    protected <T> T convertRequestBody(Object requestBody, Class<T> targetClass) {
        return objectMapper.convertValue(requestBody, targetClass);
    }
}
