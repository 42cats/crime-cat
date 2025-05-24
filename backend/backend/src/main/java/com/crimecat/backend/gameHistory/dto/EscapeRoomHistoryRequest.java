package com.crimecat.backend.gameHistory.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscapeRoomHistoryRequest {
    
    @NotNull(message = "테마 ID는 필수입니다")
    private UUID escapeRoomThemeId;
    
    @NotNull(message = "탈출 성공 여부는 필수입니다")
    private Boolean isSuccess;
    
    @Min(value = 1, message = "탈출 시간은 1분 이상이어야 합니다")
    @Max(value = 180, message = "탈출 시간은 180분 이하여야 합니다")
    private Integer escapeTimeMinutes;
    
    @NotNull(message = "체감 난이도는 필수입니다")
    @Min(value = 1, message = "체감 난이도는 1 이상이어야 합니다")
    @Max(value = 10, message = "체감 난이도는 10 이하여야 합니다")
    private Integer feltDifficulty;
    
    @NotNull(message = "참여 인원수는 필수입니다")
    @Min(value = 1, message = "참여 인원은 1명 이상이어야 합니다")
    @Max(value = 10, message = "참여 인원은 10명 이하여야 합니다")
    private Integer participantsCount;
    
    @Min(value = 0, message = "힌트 사용 횟수는 0 이상이어야 합니다")
    @Max(value = 20, message = "힌트 사용 횟수는 20 이하여야 합니다")
    private Integer hintUsedCount;
    
    @NotNull(message = "만족도는 필수입니다")
    @Min(value = 1, message = "만족도는 1 이상이어야 합니다")
    @Max(value = 10, message = "만족도는 10 이하여야 합니다")
    private Integer satisfaction;
    
    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다")
    private String memo;
    
    @NotNull(message = "공개 여부는 필수입니다")
    private Boolean isPublic;
    
    @NotNull(message = "플레이 날짜는 필수입니다")
    @PastOrPresent(message = "플레이 날짜는 현재 이전이어야 합니다")
    private LocalDateTime playDate;
    
    private Boolean hasSpoiler;
    
    @Size(max = 100, message = "매장 위치는 100자 이하여야 합니다")
    private String storeLocation;
}