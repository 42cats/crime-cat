package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;

import java.util.UUID;

/**
 * 친구 요청 알림을 위한 전용 빌더
 */
public class FriendRequestBuilder extends NotificationBuilder {
    
    public FriendRequestBuilder(NotificationService notificationService) {
        super(notificationService, NotificationType.SYSTEM_NOTICE); // 현재는 시스템 알림으로 처리
    }
    
    /**
     * 알림 준비 - 친구 요청 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 제목 설정
        if (title == null) {
            title = "친구 요청";
        }
        
        // 기본 메시지 설정
        if (message == null) {
            message = "새로운 친구 요청이 있습니다.";
        }
        
        // 필수 데이터 설정
        data("notificationType", "FRIEND_REQUEST");
        data("senderId", senderId);
        
        // 만료시간 설정 (30일)
        if (expiresAt == null) {
            expiresAt = java.time.LocalDateTime.now().plusDays(30);
        }
    }
}
