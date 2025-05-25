package com.crimecat.backend.comment.dto;

import com.crimecat.backend.comment.domain.Comment;
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
public class CommentResponse {
    private UUID id;
    private String content;
    private String authorName;
    private String authorProfileImage;
    private UUID authorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @JsonProperty("isSpoiler")
    private boolean isSpoiler;
    private int likes;
    @JsonProperty("isLikedByCurrentUser")
    private boolean isLikedByCurrentUser;
    @JsonProperty("isOwnComment")
    private boolean isOwnComment;
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    private List<CommentResponse> replies;
    
    public static CommentResponse from(
            Comment comment, 
            boolean isLikedByCurrentUser,
            boolean isOwnComment,
            boolean canViewSpoiler,
            List<CommentResponse> replies) {
        
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.isSpoiler() && !canViewSpoiler && !isOwnComment ? "[스포일러]" : comment.getContent())
                .authorName(comment.getAuthor().getUser().getName())
                .authorProfileImage(comment.getAuthor().getProfileImagePath())
                .authorId(comment.getAuthorId())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isSpoiler(comment.isSpoiler())
                .likes(comment.getLikes())
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .isOwnComment(isOwnComment)
                .isDeleted(comment.isDeleted())
                .replies(replies)
                .build();
    }
}
