package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;

import java.util.UUID;

/**
 * 새 테마 알림을 위한 전용 빌더
 */
public class NewThemeBuilder extends NotificationBuilder {
    
    private final UUID themeId;
    private final UUID authorId;
    
    public NewThemeBuilder(NotificationService notificationService, UUID themeId, UUID authorId) {
        super(notificationService, NotificationType.NEW_THEME);
        this.themeId = themeId;
        this.authorId = authorId;
    }
    
    /**
     * 테마 제목 설정 (체이닝)
     */
    public NewThemeBuilder withThemeTitle(String themeTitle) {
        data("themeTitle", themeTitle);
        return this;
    }
    
    /**
     * 테마 카테고리 설정 (체이닝)
     */
    public NewThemeBuilder withCategory(String category) {
        data("category", category);
        return this;
    }
    
    /**
     * 알림 준비 - 새 테마 특화 로직
     */
    @Override
    protected void prepareNotification() {
        // 기본 제목 설정
        if (title == null) {
            title = "새로운 테마가 등록되었습니다";
        }
        
        // 기본 메시지 설정
        if (message == null) {
            String themeTitle = (String) data.get("themeTitle");
            if (themeTitle != null) {
                message = String.format("새로운 테마 '%s'가 등록되었습니다.", themeTitle);
            } else {
                message = "새로운 테마가 등록되었습니다. 확인해보세요!";
            }
        }
        
        // 필수 데이터 설정
        data("themeId", themeId);
        data("authorId", authorId);
        data("notificationType", "NEW_THEME");
    }
    
    /**
     * 추가 검증 - 새 테마 특화
     */
    @Override
    protected void validate() {
        super.validate();
        
        if (themeId == null) {
            throw new IllegalArgumentException("Theme ID is required for new theme notification");
        }
        if (authorId == null) {
            throw new IllegalArgumentException("Author ID is required for new theme notification");
        }
    }
}
