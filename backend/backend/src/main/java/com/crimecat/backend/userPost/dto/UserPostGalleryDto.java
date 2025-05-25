package com.crimecat.backend.userPost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class UserPostGalleryDto {
    private UUID postId;
    private String authorNickname;
    private String thumbnailUrl; // 0번째 이미지 또는 null
    private int likeCount;
    private boolean liked;
}
