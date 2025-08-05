package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.domain.BoardPost;
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
public class BoardPostSummary {
    private UUID id;
    private String subject;
    private String authorName;
    private LocalDateTime createdAt;
    private Integer views;
    private Integer likes;
    private Integer comments;
    private Boolean isSecret;

    public static BoardPostSummary from(BoardPost boardPost) {
        return BoardPostSummary.builder()
                .id(boardPost.getId())
                .subject(boardPost.getSubject())
                .authorName(boardPost.getAuthor().getNickname())
                .createdAt(boardPost.getCreatedAt())
                .views(boardPost.getViews())
                .likes(boardPost.getLikes())
                .comments(boardPost.getComments())
                .isSecret(boardPost.getIsSecret())
                .build();
    }
}