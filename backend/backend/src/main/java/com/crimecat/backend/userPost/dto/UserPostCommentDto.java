package com.crimecat.backend.userPost.dto;

import com.crimecat.backend.userPost.domain.UserPostComment;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPostCommentDto {
    private UUID id;
    private String content;
    private UUID authorId;
    private String authorNickname;
    private String authorAvatarUrl;
    @JsonProperty("isPrivate")
    private boolean isPrivate;
    @JsonProperty("isDeleted")
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UserPostCommentDto> replies;
    private boolean isVisible; // 비밀 댓글 표시 여부
    private boolean isOwnComment; // 현재 사용자가 작성한 댓글인지 여부
    
    public static UserPostCommentDto from(UserPostComment comment, boolean isVisible) {
        return from(comment, isVisible, null);
    }
    
    public static UserPostCommentDto from(UserPostComment comment, boolean isVisible, UUID currentUserId) {
        if (comment == null) {
            return null;
        }
        
        // 삭제된 댓글이거나 권한이 없는 비밀 댓글인 경우 내용을 가림
        String displayContent = isVisible ? comment.getContent() : 
                                (comment.isDeleted() ? "삭제된 댓글입니다." : "비밀 댓글입니다.");
        
        // 현재 사용자가 작성한 댓글인지 확인
        boolean isOwnComment = currentUserId != null && currentUserId.equals(comment.getAuthor().getId());
        
        return UserPostCommentDto.builder()
                .id(comment.getId())
                .content(displayContent)
                .authorId(comment.getAuthor().getId())
                .authorNickname(comment.getAuthor().getNickname())
                .authorAvatarUrl(comment.getAuthor().getProfileImagePath())
                .isPrivate(comment.isPrivate())
                .isDeleted(comment.isDeleted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isVisible(isVisible)
                .isOwnComment(isOwnComment)
                .build();
    }
    
    // 중첩 답글 처리를 위한 메서드
    public static UserPostCommentDto fromWithReplies(
            UserPostComment comment, 
            List<UserPostComment> allReplies, 
            UUID currentUserId, 
            UUID postAuthorId) {
            
        boolean isVisible = isCommentVisible(comment, currentUserId, postAuthorId, null);
        UserPostCommentDto dto = from(comment, isVisible, currentUserId);
        
        if (dto != null) {
            // allReplies는 이미 정렬되어 있다고 가정 (호출 측에서 정렬 로직 처리)
            List<UserPostCommentDto> replyDtos = allReplies.stream()
                    .filter(reply -> reply.getParent() != null 
                            && reply.getParent().getId().equals(comment.getId()))
                    .map(reply -> {
                        boolean replyVisible = isCommentVisible(reply, currentUserId, postAuthorId, comment.getAuthor().getId());
                        return from(reply, replyVisible, currentUserId);
                    })
                    .collect(Collectors.toList());
            
            dto.setReplies(replyDtos);
        }
        
        return dto;
    }
    
    // 댓글 표시 권한 확인
    private static boolean isCommentVisible(
            UserPostComment comment, 
            UUID currentUserId, 
            UUID postAuthorId,
            UUID parentAuthorId) {
            
        // 삭제된 댓글은 내용이 보이지 않도록 처리
        if (comment.isDeleted()) {
            return false;
        }


        // 비밀 댓글이 아니면 누구나 볼 수 있음
        if (!comment.isPrivate()) {
            return true;
        }

        // 비밀 댓글인 경우 권한 검사

        if (currentUserId == null){
            return false;
        }

        // 1. 현재 사용자가 게시글 작성자인 경우
        if (currentUserId.equals(postAuthorId)) {
            return true;
        }
        
        // 2. 현재 사용자가 댓글 작성자인 경우
        if (currentUserId.equals(comment.getAuthor().getId())) {
            return true;
        }
        
        // 3. 대댓글이고 현재 사용자가 부모 댓글 작성자인 경우
        if (parentAuthorId != null && currentUserId.equals(parentAuthorId)) {
            return true;
        }
        
        // 그 외에는 볼 수 없음
        return false;
    }
}
