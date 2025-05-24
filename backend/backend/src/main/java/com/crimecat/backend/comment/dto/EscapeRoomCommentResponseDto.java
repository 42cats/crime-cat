package com.crimecat.backend.comment.dto;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EscapeRoomCommentResponseDto {
    
    private UUID id;
    private UUID escapeRoomThemeId;
    private String escapeRoomThemeName;
    private UUID userId;
    private String userNickname;
    private String userProfileImageUrl;
    private String content;
    private Boolean hasSpoiler;
    private Boolean isGameHistoryComment;
    private UUID escapeRoomHistoryId;
    private Boolean isAuthor;
    private Boolean canEdit;
    private Boolean canView;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 좋아요 관련 필드
    private Integer likesCount;
    private Boolean isLiked;
    
    // 스포일러 댓글이지만 볼 수 없는 경우 보여줄 메시지
    private String hiddenMessage;
    
    /**
     * Entity를 Response DTO로 변환
     */
    public static EscapeRoomCommentResponseDto from(EscapeRoomComment comment, UUID currentUserId, boolean hasGameHistory) {
        EscapeRoomCommentResponseDtoBuilder builder = EscapeRoomCommentResponseDto.builder()
                .id(comment.getId())
                .escapeRoomThemeId(comment.getEscapeRoomTheme().getId())
                .escapeRoomThemeName(comment.getEscapeRoomTheme().getTitle())
                .userId(comment.getUser().getId())
                .userNickname(comment.getUser().getName())
                .userProfileImageUrl(comment.getUser().getWebUser().getProfileImagePath())
                .hasSpoiler(comment.getHasSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .likesCount(comment.getLikesCount())
                .isLiked(false) // 기본값, 서비스에서 설정
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());
        
        // 게임 기록 기반 댓글인 경우
        if (comment.isGameHistoryComment() && comment.getEscapeRoomHistory() != null) {
            builder.escapeRoomHistoryId(comment.getEscapeRoomHistory().getId());
        }
        
        // 현재 사용자 관련 정보
        boolean isAuthor = currentUserId != null && comment.isAuthor(currentUserId);
        builder.isAuthor(isAuthor);
        builder.canEdit(isAuthor && !comment.getIsDeleted());
        
        // 스포일러 댓글 처리
        boolean canViewSpoiler = comment.canViewSpoilerComment(currentUserId, hasGameHistory);
        builder.canView(canViewSpoiler);
        
        if (comment.getHasSpoiler() && !canViewSpoiler) {
            // 스포일러 댓글을 볼 수 없는 경우
            builder.content(null);
            builder.hiddenMessage("이 댓글은 스포일러를 포함하고 있습니다. 해당 테마를 플레이한 후에 확인할 수 있습니다.");
        } else {
            // 댓글을 볼 수 있는 경우
            builder.content(comment.getContent());
        }
        
        return builder.build();
    }
    
    /**
     * 작성자용 Response DTO 생성 (항상 모든 내용 표시)
     */
    public static EscapeRoomCommentResponseDto forAuthor(EscapeRoomComment comment) {
        return EscapeRoomCommentResponseDto.builder()
                .id(comment.getId())
                .escapeRoomThemeId(comment.getEscapeRoomTheme().getId())
                .escapeRoomThemeName(comment.getEscapeRoomTheme().getTitle())
                .userId(comment.getUser().getId())
                .userNickname(comment.getUser().getName())
                .userProfileImageUrl(comment.getUser().getWebUser().getProfileImagePath())
                .content(comment.getContent())
                .hasSpoiler(comment.getHasSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .escapeRoomHistoryId(comment.getEscapeRoomHistory() != null ? comment.getEscapeRoomHistory().getId() : null)
                .likesCount(comment.getLikesCount())
                .isLiked(false) // 서비스에서 설정 필요
                .isAuthor(true)
                .canEdit(!comment.getIsDeleted())
                .canView(true)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}