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
public class BoardPostResponse {
    private UUID id;
    private String subject;
    private String content;
    private String authorName;
    private UUID authorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer views;
    private Integer likes;
    private Integer comments;
    private Boolean secret;
    @JsonProperty("isPinned")
    private Boolean isPinned;

    public static BoardPostResponse from(
            BoardPost boardPost
    ) {
        return BoardPostResponse.builder()
                .id(boardPost.getId())
                .subject(boardPost.getSubject())
                .content(boardPost.getContent())
                .authorName(boardPost.getUser().getName())
                .authorId(boardPost.getUserId())
                .createdAt(boardPost.getCreatedAt())
                .updatedAt(boardPost.getUpdatedAt())
                .views(boardPost.getViews())
                .likes(boardPost.getLikes())
                .comments(boardPost.getComments())
                .secret(boardPost.getSecret())
                .isPinned(boardPost.getIsPinned())
                .build();
    }
}
