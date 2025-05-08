package com.crimecat.backend.comment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    @NotBlank(message = "내용을 입력해주세요")
    private String content;
    
    private UUID parentId; // 대댓글인 경우 부모 댓글 ID
    
    private boolean isSpoiler; // 스포일러 여부
}
