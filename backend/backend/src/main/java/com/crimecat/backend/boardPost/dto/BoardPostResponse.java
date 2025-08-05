package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.domain.BoardPost;
import com.crimecat.backend.boardPost.enums.PostType;
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
public class BoardPostResponse {
    private UUID id;
    private Integer number;
    private String subject;
    private String authorName;
    private LocalDateTime createdAt;
    private Integer views;
    private Integer likes;
    private Integer comments;
    @JsonProperty("isSecret")
    private Boolean isSecret;
    @JsonProperty("isPinned")
    private Boolean isPinned;
    @JsonProperty("isOwnPost")
    private Boolean isOwnPost;
    private PostType postType;

    @JsonProperty("isSecret")
    public boolean isSecret() {
        return isSecret;
    }

    @JsonProperty("isPinned")
    public boolean isPinned() {
        return isPinned;
    }

    @JsonProperty("isOwnPost")
    public boolean isOwnPost() {
        return isOwnPost != null ? isOwnPost : false;
    }

    public static BoardPostResponse from(
            BoardPost boardPost,
            UUID currentUserId
    ) {
        return BoardPostResponse.builder()
                .id(boardPost.getId())
                .number(boardPost.getNumber())
                .subject(boardPost.getSubject())
                .authorName(boardPost.getAuthor().getNickname())
                .createdAt(boardPost.getCreatedAt())
                .views(boardPost.getViews())
                .likes(boardPost.getLikes())
                .comments(boardPost.getComments())
                .isSecret(boardPost.getIsSecret())
                .isPinned(boardPost.getIsPinned())
                .isOwnPost(currentUserId != null && boardPost.getAuthorId().equals(currentUserId))
                .postType(boardPost.getPostType())
                .build();
    }

    // 기존 호환성을 위한 오버로드 메서드
    public static BoardPostResponse from(BoardPost boardPost) {
        return from(boardPost, null);
    }
}
