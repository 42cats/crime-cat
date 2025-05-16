package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;

import java.util.UUID;

/**
 * 게임 기록 응답 알림을 위한 전용 빌더
 * 승인/거절 결과를 알리는 알림 생성
 */
public class GameRecordResponseBuilder extends NotificationBuilder {
    
    private final UUID originalRequestId;
    private final boolean approved;
    
    public GameRecordResponseBuilder(NotificationService notificationService, UUID originalRequestId, boolean approved) {
        super(notificationService, NotificationType.SYSTEM_NOTICE);
        this.originalRequestId = originalRequestId;
        this.approved = approved;
    }
    
    /**
     * 상세 메시지 설정 (체이닝)
     */
    public GameRecordResponseBuilder withDetails(String details) {
        data("details", details);
        return this;
    }
    
    /**
     * 알림 준비 - 게임 기록 응답 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 승인/거절에 따른 제목 설정
        if (title == null) {
            title = approved ? "게임 기록 등록 승인" : "게임 기록 등록 거절";
        }
        
        // 승인/거절에 따른 기본 메시지 설정
        if (message == null) {
            if (approved) {
                message = "요청하신 게임 기록이 성공적으로 등록되었습니다.";
            } else {
                String details = (String) data.get("details");
                if (details != null && !details.trim().isEmpty()) {
                    message = String.format("게임 기록 등록 요청이 거절되었습니다. 사유: %s", details);
                } else {
                    message = "게임 기록 등록 요청이 거절되었습니다.";
                }
            }
        }
        
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
