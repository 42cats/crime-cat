package com.crimecat.backend.webUser.dto;

import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserPostNotificationSettingsDto {
    private Boolean userPostNew;        // 새 게시글 알림
    private Boolean userPostComment;    // 댓글 알림  
    private Boolean userPostCommentReply; // 답글 알림
    
    public static UserPostNotificationSettingsDto from(java.util.Map<String, Object> notificationSettings) {
        return UserPostNotificationSettingsDto.builder()
            .userPostNew((Boolean) notificationSettings.getOrDefault("userPostNew", true))
            .userPostComment((Boolean) notificationSettings.getOrDefault("userPostComment", true))
            .userPostCommentReply((Boolean) notificationSettings.getOrDefault("userPostCommentReply", true))
            .build();
    }
}