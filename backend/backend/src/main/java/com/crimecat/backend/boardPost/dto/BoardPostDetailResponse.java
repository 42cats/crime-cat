package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardPostDetailResponse {
    private UUID id;
    private Integer number;
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
    private Integer comments;
    @JsonProperty("isLikedByCurrentUser")
    private boolean isLikedByCurrentUser;
    @JsonProperty("isPinned")
    private Boolean isPinned;
    @JsonProperty("isSecret")
    private Boolean isSecret;


    public static BoardPostDetailResponse from(
            BoardPost boardPost,
            Boolean isOwnPost,
            Boolean isLikedByCurrentUser
    ) {
        return BoardPostDetailResponse.builder()
                .id(boardPost.getId())
                .number(boardPost.getNumber())
                .subject(boardPost.getSubject())
                .content(boardPost.getContent())
                .authorName(boardPost.getAuthor().getNickname())
                .authorProfileImage(boardPost.getAuthor().getProfileImagePath())
                .authorId(boardPost.getAuthorId())
                .isOwnPost(isOwnPost)
                .createdAt(boardPost.getCreatedAt())
                .updatedAt(boardPost.getUpdatedAt())
                .views(boardPost.getViews())
                .likes(boardPost.getLikes())
                .comments(boardPost.getComments())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .isPinned(boardPost.getIsPinned())
                .isSecret(boardPost.getIsSecret())
                .build();
    }
}

