package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.domain.PostComment;
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
public class PostCommentResponse {

    private UUID id;
    private String content;
    private String authorName;
    private String authorProfileImage;
    private UUID authorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int likes;
    @JsonProperty("isLikedByCurrentUser")
    private boolean isLikedByCurrentUser;
    @JsonProperty("isOwnComment")
    private boolean isOwnComment;
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    @JsonProperty("isSecret")
    private boolean isSecret;
    private List<PostCommentResponse> replies;

    public static PostCommentResponse from(
            PostComment comment,
            boolean isLikedByCurrentUser,
            boolean isOwnComment,
            boolean canViewSecret,
            List<PostCommentResponse> replies) {

        return PostCommentResponse.builder()
                .id(comment.getId())
                .content(comment.getIsSecret() && !canViewSecret && !isOwnComment ? "[비밀댓글]" : comment.getContent())
                .authorName(comment.getAuthor().getNickname())
                .authorProfileImage(comment.getAuthor().getProfileImagePath())
                .authorId(comment.getAuthorId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isSecret(comment.getIsSecret())
                .likes(comment.getLikes())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .isOwnComment(isOwnComment)
                .isDeleted(comment.getIsDeleted())
                .replies(replies)
                .build();
    }
}

