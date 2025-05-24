package com.crimecat.backend.comment.dto;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import com.crimecat.backend.gameHistory.enums.SuccessStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import java.util.stream.Collectors;

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
    
    // 대댓글 관련 필드
    private UUID parentCommentId;
    private List<EscapeRoomCommentResponseDto> replies;
    
    // 게임 기록 관련 정보 (선택적으로 표시)
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameHistoryInfo {
        private Integer teamSize;
        private SuccessStatus successStatus;
        private Integer clearTime;
        private String formattedClearTime;
        private Integer hintCount;
        private Integer difficultyRating;
        private Double difficultyRatingStars;
        private Integer funRating;
        private Double funRatingStars;
        private Integer storyRating;
        private Double storyRatingStars;
        private LocalDate playDate;
    }

    private GameHistoryInfo gameHistoryInfo;

    /**
     * Entity를 Response DTO로 변환
     */
    public static EscapeRoomCommentResponseDto from(EscapeRoomComment comment, UUID currentUserId, boolean hasGameHistory) {
        EscapeRoomCommentResponseDtoBuilder builder = EscapeRoomCommentResponseDto.builder()
                .id(comment.getId())
                .escapeRoomThemeId(comment.getEscapeRoomTheme().getId())
                .escapeRoomThemeName(comment.getEscapeRoomTheme().getTitle())
                .userId(comment.getWebUser().getId())
                .userNickname(comment.getWebUser().getNickname())
                .userProfileImageUrl(comment.getWebUser().getProfileImagePath())
                .hasSpoiler(comment.getIsSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .likesCount(comment.getLikesCount())
                .isLiked(false) // 기본값, 서비스에서 설정
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());
        
        // 게임 기록 기반 댓글인 경우
        if (comment.isGameHistoryComment() && comment.getEscapeRoomHistory() != null) {
            EscapeRoomHistory history = comment.getEscapeRoomHistory();
            builder.escapeRoomHistoryId(history.getId());
            
            // 게임 기록 정보 추가
            GameHistoryInfo historyInfo = GameHistoryInfo.builder()
                    .teamSize(history.getTeamSize())
                    .successStatus(history.getSuccessStatus())
                    .clearTime(history.getClearTime())
                    .formattedClearTime(history.getFormattedClearTime())
                    .hintCount(history.getHintCount())
                    .difficultyRating(history.getDifficultyRating())
                    .difficultyRatingStars(history.getDifficultyRatingStars())
                    .funRating(history.getFunRating())
                    .funRatingStars(history.getFunRatingStars())
                    .storyRating(history.getStoryRating())
                    .storyRatingStars(history.getStoryRatingStars())
                    .playDate(history.getPlayDate())
                    .build();
            
            builder.gameHistoryInfo(historyInfo);
        }
        
        // 대댓글인 경우
        if (comment.isReplyComment() && comment.getParentComment() != null) {
            builder.parentCommentId(comment.getParentComment().getId());
        }
        
        // 현재 사용자 관련 정보
        boolean isAuthor = currentUserId != null && comment.isAuthor(currentUserId);
        builder.isAuthor(isAuthor);
        builder.canEdit(isAuthor && !comment.isDeleted());
        
        // 스포일러 댓글 처리
        boolean canViewSpoiler = comment.canViewSpoilerComment(currentUserId, hasGameHistory);
        builder.canView(canViewSpoiler);
        
        if (comment.getIsSpoiler() && !canViewSpoiler) {
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
        EscapeRoomCommentResponseDtoBuilder builder = EscapeRoomCommentResponseDto.builder()
                .id(comment.getId())
                .escapeRoomThemeId(comment.getEscapeRoomTheme().getId())
                .escapeRoomThemeName(comment.getEscapeRoomTheme().getTitle())
                .userId(comment.getWebUser().getId())
                .userNickname(comment.getWebUser().getNickname())
                .userProfileImageUrl(comment.getWebUser().getProfileImagePath())
                .content(comment.getContent())
                .hasSpoiler(comment.getIsSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .likesCount(comment.getLikesCount())
                .isLiked(false) // 서비스에서 설정 필요
                .isAuthor(true)
                .canEdit(!comment.isDeleted())
                .canView(true)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());
        
        // 게임 기록 기반 댓글인 경우
        if (comment.isGameHistoryComment() && comment.getEscapeRoomHistory() != null) {
            EscapeRoomHistory history = comment.getEscapeRoomHistory();
            builder.escapeRoomHistoryId(history.getId());
            
            // 게임 기록 정보 추가
            GameHistoryInfo historyInfo = GameHistoryInfo.builder()
                    .teamSize(history.getTeamSize())
                    .successStatus(history.getSuccessStatus())
                    .clearTime(history.getClearTime())
                    .formattedClearTime(history.getFormattedClearTime())
                    .hintCount(history.getHintCount())
                    .difficultyRating(history.getDifficultyRating())
                    .difficultyRatingStars(history.getDifficultyRatingStars())
                    .funRating(history.getFunRating())
                    .funRatingStars(history.getFunRatingStars())
                    .storyRating(history.getStoryRating())
                    .storyRatingStars(history.getStoryRatingStars())
                    .playDate(history.getPlayDate())
                    .build();
            
            builder.gameHistoryInfo(historyInfo);
        }
        
        // 대댓글인 경우
        if (comment.isReplyComment() && comment.getParentComment() != null) {
            builder.parentCommentId(comment.getParentComment().getId());
        }
        
        return builder.build();
    }
    
    /**
     * 댓글 목록에 대댓글을 추가
     */
    public static List<EscapeRoomCommentResponseDto> addReplies(
            List<EscapeRoomCommentResponseDto> comments, 
            List<EscapeRoomComment> allReplies,
            UUID currentUserId,
            boolean hasGameHistory) {
        
        // 부모 댓글 ID별 대댓글 그룹화
        var repliesByParentId = allReplies.stream()
                .collect(Collectors.groupingBy(
                        reply -> reply.getParentComment().getId()
                ));
        
        // 각 댓글에 대댓글 추가
        return comments.stream()
                .map(comment -> {
                    List<EscapeRoomComment> replies = repliesByParentId.get(comment.getId());
                    if (replies != null && !replies.isEmpty()) {
                        List<EscapeRoomCommentResponseDto> replyDtos = replies.stream()
                                .map(reply -> EscapeRoomCommentResponseDto.from(reply, currentUserId, hasGameHistory))
                                .collect(Collectors.toList());
                        comment.setReplies(replyDtos);
                    }
                    return comment;
                })
                .collect(Collectors.toList());
    }
}