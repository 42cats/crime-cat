package com.crimecat.backend.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscapeRoomCommentCreateDto {
    
    @NotNull(message = "테마 ID는 필수입니다")
    private UUID escapeRoomThemeId;
    
    @NotBlank(message = "댓글 내용은 필수입니다")
    @Size(min = 1, max = 2000, message = "댓글은 1자 이상 2000자 이하로 작성해주세요")
    private String content;
    
    @Builder.Default
    private Boolean hasSpoiler = false;
    
    // 게임 기록 기반 댓글인 경우 해당 기록 ID
    private UUID escapeRoomHistoryId;
}