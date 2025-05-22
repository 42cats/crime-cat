package com.crimecat.backend.notification.event;

import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * 새 유저 포스트 생성 이벤트
 * 사용자가 새 포스트를 작성할 때 팔로워들에게 알림
 */
@Getter
public class UserPostCreatedEvent extends NotificationEvent {
    
    // 포스트 정보
    private final UUID postId;
    private final String postContent;
    private final UUID authorId;
    private final String authorNickname;
    
    // 알림 대상 팔로워 목록
    private final List<UUID> followerIds;
    
    public UserPostCreatedEvent(Object source, UUID postId, String postContent,
                               UUID authorId, String authorNickname, List<UUID> followerIds) {
        super(source, null, authorId); // 수신자는 리스트로 별도 관리
        this.postId = postId;
        this.postContent = postContent;
        this.authorId = authorId;
        this.authorNickname = authorNickname;
        this.followerIds = followerIds;
        
        // 기본 제목과 메시지 설정
        String shortContent = postContent.length() > 50 ? 
            postContent.substring(0, 50) + "..." : postContent;
        
        this.withTitle("새 게시글 알림")
            .withMessage(String.format("%s님이 새 게시글을 작성했습니다: %s", authorNickname, shortContent))
            .withData("postId", postId)
            .withData("postContent", postContent)
            .withData("authorId", authorId)
            .withData("authorNickname", authorNickname)
            .withData("linkUrl", "/posts/" + postId);
    }
    
    /**
     * 팩토리 메서드
     */
    public static UserPostCreatedEvent of(Object source, UUID postId, String postContent,
                                         UUID authorId, String authorNickname, List<UUID> followerIds) {
        return new UserPostCreatedEvent(source, postId, postContent, 
                                       authorId, authorNickname, followerIds);
    }
}