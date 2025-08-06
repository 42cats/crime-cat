package com.crimecat.backend.boardPost.dto;

import com.crimecat.backend.boardPost.enums.BoardType;
import com.crimecat.backend.boardPost.enums.PostType;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardPostRequest {
    @NotBlank(message = "제목을 입력해주세요")
    private String subject;
    @NotBlank(message = "내용을 입력해주세요")
    private String content;

    @Builder.Default
    @JsonProperty("isSecret")
    private Boolean isSecret = false;

    @Builder.Default
    private PostType postType = PostType.GENERAL;

    @Builder.Default
    private BoardType boardType = BoardType.NONE;

    @Builder.Default
    @JsonProperty("isPinned")
    private Boolean isPinned = false;

    private List<String> tempAudioIds;

    @JsonProperty("isPinned")
    public boolean isPinned() {
        return isPinned;
    }

    @JsonProperty("isSecret")
    public boolean isSecret() {
        return isSecret;
    }
}
