package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

/**
 * 친구 요청 알림을 위한 전용 빌더
 * 제네릭을 사용하여 타입 안전성 확보
 */
public class FriendRequestBuilder extends NotificationBuilder<FriendRequestBuilder> {
    
    public FriendRequestBuilder(NotificationService notificationService, TemplateService templateService) {
        super(notificationService, templateService, NotificationType.SYSTEM_NOTICE); // 현재는 시스템 알림으로 처리
    }
    
    /**
     * 요청자 닉네임 설정 (체이닝)
     */
    public FriendRequestBuilder withRequesterNickname(String nickname) {
        return data("requesterNickname", nickname);
    }
    
    /**
     * 알림 준비 - 친구 요청 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 데이터 설정
        data("notificationType", "FRIEND_REQUEST");
        data("senderId", senderId);
        
        // 만료시간 설정 (30일)
        if (expiresAt == null) {
            expiresAt = java.time.LocalDateTime.now().plusDays(30);
        }
    }
}
