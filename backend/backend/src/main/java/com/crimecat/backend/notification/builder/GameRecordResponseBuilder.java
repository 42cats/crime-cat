package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 게임 기록 응답 알림을 위한 전용 빌더
 * 승인/거절 결과를 알리는 알림 생성
 * 제네릭을 사용하여 타입 안전성 확보
 */
public class GameRecordResponseBuilder extends NotificationBuilder<GameRecordResponseBuilder> {
    
    private final UUID originalRequestId;
    private final boolean approved;
    
    public GameRecordResponseBuilder(NotificationService notificationService, TemplateService templateService,
                                     UUID originalRequestId, boolean approved) {
        super(notificationService, templateService, NotificationType.SYSTEM_NOTICE);
        this.originalRequestId = originalRequestId;
        this.approved = approved;
    }
    
    /**
     * 상세 메시지 설정 (체이닝)
     */
    public GameRecordResponseBuilder withDetails(String details) {
        return data("details", details);
    }
    
    /**
     * 게임 테마 제목 설정 (체이닝)
     */
    public GameRecordResponseBuilder withGameThemeTitle(String themeTitle) {
        return data("gameThemeTitle", themeTitle);
    }
    
    /**
     * 알림 준비 - 게임 기록 응답 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 필수 데이터 설정
        data("originalRequestId", originalRequestId);
        data("approved", approved);
        data("notificationType", "GAME_RECORD_RESPONSE");
        data("responseType", approved ? "APPROVED" : "REJECTED");
    }
    
    /**
     * 추가 검증 - 게임 기록 응답 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (originalRequestId == null) {
            throw new IllegalArgumentException("Original request ID is required for game record response");
        }
    }
}
