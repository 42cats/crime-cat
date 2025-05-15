package com.crimecat.backend.notification.service;

import com.crimecat.backend.notification.domain.Notification;
import com.crimecat.backend.notification.enums.NotificationStatus;
import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.handler.NotificationHandler;
import com.crimecat.backend.notification.repository.NotificationRepository;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 알림 핸들러들을 통합 관리하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationHandlerService {
    
    private final List<NotificationHandler> handlers;
    private final NotificationRepository notificationRepository;
    
    /**
     * 알림 액션 처리
     * 자동으로 적절한 핸들러를 찾아 처리
     */
    public void processAction(UUID notificationId, String action, Object requestBody) {
        // 1. 알림 조회
        Notification notification = findNotification(notificationId);
        
        // 2. 권한 검증 (알림 소유자만 액션 수행 가능)
        AuthenticationUtil.validateCurrentUserMatches(notification.getUserId());
        
        // 3. 이미 처리된 알림인지 확인
        if (notification.getStatus() == NotificationStatus.PROCESSED) {
            throw ErrorStatus.NOTIFICATION_ALREADY_PROCESSED.asServiceException();
        }
        
        // 4. 적절한 핸들러 찾기
        NotificationHandler handler = findHandler(notification.getType());
        
        // 5. 액션 지원 여부 확인
        if (!handler.getSupportedActions().contains(action)) {
            throw ErrorStatus.INVALID_NOTIFICATION_ACTION.asServiceException();
        }
        
        // 6. 유효성 검증
        handler.validateAction(action, requestBody);
        
        // 7. 액션 처리
        handler.handleAction(notificationId, action, requestBody);
        
        // 8. 알림 상태 업데이트
        updateNotificationStatus(notification);
    }
    
    /**
     * 알림 타입에 맞는 핸들러 찾기
     */
    private NotificationHandler findHandler(NotificationType type) {
        return handlers.stream()
            .filter(handler -> handler.supports(type))
            .findFirst()
            .orElseThrow(ErrorStatus.INVALID_NOTIFICATION_ACTION::asServiceException);
    }
    
    /**
     * 알림 상태를 처리됨으로 업데이트
     */
    private void updateNotificationStatus(Notification notification) {
        notification.setStatus(NotificationStatus.PROCESSED);
        notification.setUpdatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
    
    /**
     * 알림 조회 및 검증
     */
    private Notification findNotification(UUID notificationId) {
        return notificationRepository.findById(notificationId)
            .orElseThrow(ErrorStatus.NOTIFICATION_NOT_FOUND::asServiceException);
    }
}
