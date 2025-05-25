package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
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
public class PostCommentRequest {
    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    @Builder.Default
    @JsonProperty("isSecret")
    private Boolean isSecret = false;

    private UUID parentId;

    @JsonProperty("isSecret")
    public boolean isSecret() {
        return isSecret;
    }
}
