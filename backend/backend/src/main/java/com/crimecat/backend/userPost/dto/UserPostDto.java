package com.crimecat.backend.userPost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class UserPostDto {
    private UUID postId;
    private String content;
    private String authorNickname;
    private String authorAvatarUrl;
    private List<String> imageUrls;
    private int likeCount;
    private boolean liked;
    private boolean isPrivate;
    private boolean isFollowersOnly;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID authorId;
    private List<UserPostCommentDto> comments;
}
