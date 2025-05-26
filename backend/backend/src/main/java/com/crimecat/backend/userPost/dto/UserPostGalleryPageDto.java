package com.crimecat.backend.userPost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPostGalleryPageDto {
    private UUID postId;
    private String authorNickname;
    private String authorAvatarUrl;
    private UUID authorId;
    private String content;
    private String thumbnailUrl; // 0번째 이미지 또는 null
    private int likeCount;
    private boolean isPrivate;
    private boolean isFollowersOnly;
    private LocalDateTime createdAt;
    private String collectionName; // 저장된 컬렉션 이름 (저장된 게시물 목록에서 사용)
    private List<String> hashtags; // 해시태그 목록 추가
    private String locationName; // 위치 이름
}
