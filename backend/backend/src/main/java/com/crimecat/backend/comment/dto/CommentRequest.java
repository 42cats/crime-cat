package com.crimecat.backend.comment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("isSpoiler") // 명시적으로 JSON 키 이름을 지정
    private boolean isSpoiler; // 스포일러 여부
}
