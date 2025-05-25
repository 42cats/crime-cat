package com.crimecat.backend.comment.dto;

import com.crimecat.backend.comment.domain.EscapeRoomComment;
import com.crimecat.backend.gameHistory.enums.SuccessStatus;
import com.crimecat.backend.gameHistory.domain.EscapeRoomHistory;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    
    private List<EscapeRoomCommentResponseDto> replies;
    
    // 부가 정보 (기존 필드들 중 필요한 것들)
    private UUID escapeRoomThemeId;
    private String escapeRoomThemeName;
    private Boolean isGameHistoryComment;
    private UUID escapeRoomHistoryId;
    private Boolean canEdit;
    private Boolean canView;
    
    // 숨겨진 메시지 (스포일러 댓글을 볼 수 없는 경우)
    private String hiddenMessage;
    
    // JsonProperty 필드를 위한 명시적 setter 메소드들
    public void setIsLikedByCurrentUser(boolean isLikedByCurrentUser) {
        this.isLikedByCurrentUser = isLikedByCurrentUser;
    }
    
    public void setIsOwnComment(boolean isOwnComment) {
        this.isOwnComment = isOwnComment;
    }
    
    public void setIsSpoiler(boolean isSpoiler) {
        this.isSpoiler = isSpoiler;
    }
    
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
                .authorId(comment.getWebUser().getId())
                .authorName(comment.getWebUser().getNickname())
                .authorProfileImage(comment.getWebUser().getProfileImagePath())
                .isSpoiler(comment.getIsSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .likes(comment.getLikesCount())
                .isLikedByCurrentUser(false) // 기본값, 서비스에서 설정
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isDeleted(comment.isDeleted())
                .replies(new ArrayList<>()); // 빈 replies 리스트 초기화
        
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
        
        // 현재 사용자 관련 정보
        boolean isOwnComment = currentUserId != null && comment.isAuthor(currentUserId);
        builder.isOwnComment(isOwnComment);
        builder.canEdit(isOwnComment && !comment.isDeleted());
        
        // 스포일러 댓글 처리
        boolean canViewSpoiler = comment.canViewSpoilerComment(currentUserId, hasGameHistory);
        builder.canView(canViewSpoiler);
        
        if (comment.getIsSpoiler() && !canViewSpoiler) {
            // 스포일러 댓글을 볼 수 없는 경우
            builder.content(null);
            builder.hiddenMessage("이 댓글은 스포일러를 포함하고 있습니다. 해당 테마를 플레이한 후에 확인할 수 있습니다.");
        }
        else if (comment.isDeleted()) {
            builder.content("[삭제된 메시지 입니다]");
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
                .authorId(comment.getWebUser().getId())
                .authorName(comment.getWebUser().getNickname())
                .authorProfileImage(comment.getWebUser().getProfileImagePath())
                .content(comment.getContent())
                .isSpoiler(comment.getIsSpoiler())
                .isGameHistoryComment(comment.isGameHistoryComment())
                .likes(comment.getLikesCount())
                .isLikedByCurrentUser(false) // 서비스에서 설정 필요
                .isOwnComment(true)
                .canEdit(!comment.isDeleted())
                .canView(true)
                .isDeleted(comment.isDeleted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(new ArrayList<>()); // 빈 replies 리스트 초기화
        
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
        
        return builder.build();
    }
    
    /**
     * 댓글 목록을 계층 구조로 구성
     * 대댓글은 부모 댓글의 replies 필드에 추가
     */
    public static List<EscapeRoomCommentResponseDto> organizeHierarchy(
            List<EscapeRoomComment> allComments,
            UUID currentUserId,
            boolean hasGameHistory) {
        
        // 모든 댓글을 DTO로 변환
        List<EscapeRoomCommentResponseDto> allDtos = allComments.stream()
                .map(comment -> from(comment, currentUserId, hasGameHistory))
                .collect(Collectors.toList());
        
        // 댓글 ID를 키로 하는 맵 생성
        var dtoMap = allDtos.stream()
                .collect(Collectors.toMap(
                        EscapeRoomCommentResponseDto::getId,
                        dto -> dto
                ));
        
        // 부모 댓글 목록 (최상위 댓글만 포함)
        List<EscapeRoomCommentResponseDto> parentComments = new ArrayList<>();
        
        // 각 댓글을 순회하며 부모-자식 관계 구성
        for (EscapeRoomComment comment : allComments) {
            EscapeRoomCommentResponseDto dto = dtoMap.get(comment.getId());
            
            if (comment.isReplyComment() && comment.getParentComment() != null) {
                // 대댓글인 경우
                UUID parentId = comment.getParentComment().getId();
                EscapeRoomCommentResponseDto parentDto = dtoMap.get(parentId);
                
                if (parentDto != null) {
                    // 부모 댓글의 replies 목록에 추가
                    if (parentDto.getReplies() == null) {
                        parentDto.setReplies(new ArrayList<>());
                    }
                    parentDto.getReplies().add(dto);
                }
            } else {
                // 부모 댓글인 경우 (또는 parentComment가 null인 경우)
                parentComments.add(dto);
            }
        }
        
        return parentComments;
    }
}