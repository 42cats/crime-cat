package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * 새 테마 발행 이벤트
 * 새로운 게임 테마가 발행될 때 관심있는 사용자들에게 알림
 */
@Getter
public class NewThemeEvent extends NotificationEvent {
    
    // 테마 정보
    private final UUID themeId;
    private final String themeTitle;
    private final String themeCategory;
    private final UUID authorId;
    private final String authorNickname;
    
    // 알림 대상 사용자 목록
    private final List<UUID> targetUserIds;
    
    public NewThemeEvent(Object source, UUID themeId, String themeTitle, String themeCategory,
                         UUID authorId, String authorNickname, List<UUID> targetUserIds) {
        super(source, null, authorId); // 수신자는 리스트로 별도 관리
        this.themeId = themeId;
        this.themeTitle = themeTitle;
        this.themeCategory = themeCategory;
        this.authorId = authorId;
        this.authorNickname = authorNickname;
        this.targetUserIds = targetUserIds;
        
        // 기본 제목과 메시지 설정
        this.withTitle("새로운 테마 등록")
            .withMessage(String.format("새로운 %s 테마 '%s'가 등록되었습니다", themeCategory, themeTitle))
            .withData("themeId", themeId)
            .withData("themeTitle", themeTitle)
            .withData("themeCategory", themeCategory)
            .withData("authorId", authorId)
            .withData("authorNickname", authorNickname);
    }
    
    /**
     * 팩토리 메서드
     */
    public static NewThemeEvent of(Object source, UUID themeId, String themeTitle, String themeCategory,
                                   UUID authorId, String authorNickname, List<UUID> targetUserIds) {
        return new NewThemeEvent(source, themeId, themeTitle, themeCategory, 
                                authorId, authorNickname, targetUserIds);
    }
    
    /**
     * 단일 사용자 대상 팩토리 메서드
     */
    public static NewThemeEvent forUser(Object source, UUID themeId, String themeTitle, String themeCategory,
                                        UUID authorId, String authorNickname, UUID targetUserId) {
        return new NewThemeEvent(source, themeId, themeTitle, themeCategory, 
                                authorId, authorNickname, List.of(targetUserId));
    }
}
