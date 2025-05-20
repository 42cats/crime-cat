package com.crimecat.backend.userPost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

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
}
