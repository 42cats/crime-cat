package com.crimecat.backend.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscapeRoomCommentUpdateDto {
    
    @NotBlank(message = "댓글 내용은 필수입니다")
    @Size(min = 1, max = 2000, message = "댓글은 1자 이상 2000자 이하로 작성해주세요")
    private String content;
    
    private Boolean hasSpoiler;
}