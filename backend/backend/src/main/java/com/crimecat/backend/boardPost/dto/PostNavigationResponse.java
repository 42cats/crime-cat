package com.crimecat.backend.boardPost.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostNavigationResponse {
    private BoardPostSummary previousPost; // null 가능 - 이전글이 없는 경우
    private BoardPostSummary nextPost;     // null 가능 - 다음글이 없는 경우
    private BoardPostSummary currentPost;
}