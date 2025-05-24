package com.crimecat.backend.gameHistory.dto;

import com.crimecat.backend.gameHistory.enums.SuccessStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryRequest {
    @NotNull(message = "테마 ID는 필수입니다")
    private UUID escapeRoomThemeId;
    
    private UUID escapeRoomLocationId;
    
    @NotNull(message = "팀 인원수는 필수입니다")
    @Min(value = 1, message = "팀 인원은 1명 이상이어야 합니다")
    @Max(value = 10, message = "팀 인원은 10명 이하여야 합니다")
    private Integer teamSize;
    
    @NotNull(message = "성공 여부는 필수입니다")
    private SuccessStatus successStatus;
    
    @Min(value = 1, message = "클리어 시간은 1분 이상이어야 합니다")
    @Max(value = 180, message = "클리어 시간은 180분 이하여야 합니다")
    private Integer clearTime;
    
    @Min(value = 0, message = "힌트 사용 횟수는 0 이상이어야 합니다")
    @Max(value = 20, message = "힌트 사용 횟수는 20 이하여야 합니다")
    private Integer hintCount;
    
    @Min(value = 1, message = "난이도 평점은 1 이상이어야 합니다")
    @Max(value = 5, message = "난이도 평점은 5 이하여야 합니다")
    private Integer difficultyRating;
    
    @Min(value = 1, message = "재미 평점은 1 이상이어야 합니다")
    @Max(value = 5, message = "재미 평점은 5 이하여야 합니다")
    private Integer funRating;
    
    @Min(value = 1, message = "스토리 평점은 1 이상이어야 합니다")
    @Max(value = 5, message = "스토리 평점은 5 이하여야 합니다")
    private Integer storyRating;
    
    @NotNull(message = "플레이 날짜는 필수입니다")
    @PastOrPresent(message = "플레이 날짜는 현재 이전이어야 합니다")
    private LocalDate playDate;
    
    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다")
    private String memo;
    
    private Boolean isSpoiler;
}