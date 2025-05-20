package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardPostDetailResponse {
    private UUID id;
    private String subject;
    private String content;
    private String authorName;
    private String authorProfileImage;
    private UUID authorId;
    @JsonProperty("isOwnPost")
    private boolean isOwnPost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer views;
    private Integer likes;
    @JsonProperty("isLikedByCurrentUser")
    private boolean isLikedByCurrentUser;
    private Integer comments;
    @JsonProperty("isPinned")
    private Boolean isPinned;
//    private List<PostCommentResponse> comments;


    public static BoardPostDetailResponse from(
            BoardPost boardPost
    ) {
        return BoardPostDetailResponse.builder()
                .id(boardPost.getId())
                .subject(boardPost.getSubject())
                .content(boardPost.getContent())
                .authorName(boardPost.getUser().getNickname())
                .authorProfileImage(boardPost.getUser().getProfileImagePath())
                .authorId(boardPost.getUserId())
//                .isOwnPost()
                .createdAt(boardPost.getCreatedAt())
                .updatedAt(boardPost.getUpdatedAt())
                .views(boardPost.getViews())
                .likes(boardPost.getLikes())
//                .isLikedByCurrentUser()
                .comments(boardPost.getComments())
                .isPinned(boardPost.getIsPinned())
//                .comments()
                .build();
    }
}

