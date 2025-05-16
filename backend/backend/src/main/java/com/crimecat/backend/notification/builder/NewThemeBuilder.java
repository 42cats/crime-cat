package com.crimecat.backend.notification.builder;

import com.crimecat.backend.notification.enums.NotificationType;
import com.crimecat.backend.notification.service.NotificationService;
import com.crimecat.backend.notification.template.TemplateService;

import java.util.UUID;

/**
 * 새 테마 알림을 위한 전용 빌더
 * 제네릭을 사용하여 타입 안전성 확보
 */
public class NewThemeBuilder extends NotificationBuilder<NewThemeBuilder> {
    
    private final UUID themeId;
    private final UUID authorId;
    
    public NewThemeBuilder(NotificationService notificationService, TemplateService templateService,
                           UUID themeId, UUID authorId) {
        super(notificationService, templateService, NotificationType.NEW_THEME);
        this.themeId = themeId;
        this.authorId = authorId;
    }
    
    /**
     * 테마 제목 설정 (체이닝)
     * 이제 타입 안전성이 보장됨
     */
    public NewThemeBuilder withThemeTitle(String themeTitle) {
        return data("themeTitle", themeTitle);
    }
    
    /**
     * 테마 카테고리 설정 (체이닝)
     */
    public NewThemeBuilder withCategory(String category) {
        return data("category", category);
    }
    
    /**
     * 작성자 닉네임 설정 (체이닝)
     */
    public NewThemeBuilder withAuthorNickname(String authorNickname) {
        return data("authorNickname", authorNickname);
    }
    
    /**
     * 알림 준비 - 새 테마 특화 로직
     */
    @Override
    protected void prepareNotification() {
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
