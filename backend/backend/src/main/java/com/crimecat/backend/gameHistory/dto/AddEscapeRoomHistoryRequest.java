package com.crimecat.backend.gameHistory.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 방탈출 히스토리 생성 요청 DTO
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddEscapeRoomHistoryRequest {

    /**
     * 방탈출 테마 ID (필수)
     */
    @NotNull(message = "테마 ID는 필수입니다.")
    private UUID escapeRoomThemeId;

    /**
     * 탈출 성공 여부 (필수)
     */
    @NotNull(message = "성공 여부는 필수입니다.")
    private Boolean isSuccess;

    /**
     * 탈출 시간 (분 단위)
     * 실패해도 기록 가능 (진행한 시간)
     */
    @Min(value = 1, message = "탈출 시간은 1분 이상이어야 합니다.")
    @Max(value = 600, message = "탈출 시간은 600분(10시간) 이하여야 합니다.")
    private Integer escapeTimeMinutes;

    /**
     * 체감 난이도 (1-10, 별 5개 표시용, 필수)
     */
    @NotNull(message = "체감 난이도는 필수입니다.")
    @Min(value = 1, message = "체감 난이도는 1 이상이어야 합니다.")
    @Max(value = 10, message = "체감 난이도는 10 이하여야 합니다.")
    private Integer feltDifficulty;

    /**
     * 참여 인원 수 (필수)
     */
    @NotNull(message = "참여 인원은 필수입니다.")
    @Min(value = 1, message = "참여 인원은 1명 이상이어야 합니다.")
    @Max(value = 20, message = "참여 인원은 20명 이하여야 합니다.")
    private Integer participantsCount;

    /**
     * 힌트 사용 횟수 (기본값: 0)
     */
    @Min(value = 0, message = "힌트 사용 횟수는 0 이상이어야 합니다.")
    @Max(value = 50, message = "힌트 사용 횟수는 50회 이하여야 합니다.")
    private Integer hintUsedCount = 0;

    /**
     * 만족도 (1-10, 별 5개 표시용, 필수)
     */
    @NotNull(message = "만족도는 필수입니다.")
    @Min(value = 1, message = "만족도는 1 이상이어야 합니다.")
    @Max(value = 10, message = "만족도는 10 이하여야 합니다.")
    private Integer satisfaction;

    /**
     * 메모/후기 (1000자 제한)
     */
    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다.")
    private String memo;

    /**
     * 기록 공개 여부 (기본값: 공개)
     */
    private Boolean isPublic = true;

    /**
     * 플레이 날짜 (필수)
     */
    @NotNull(message = "플레이 날짜는 필수입니다.")
    @PastOrPresent(message = "플레이 날짜는 현재 시간 이전이어야 합니다.")
    private LocalDateTime playDate;

    /**
     * 스포일러 포함 여부
     */
    private Boolean hasSpoiler = false;

    /**
     * 매장 위치 (어느 지점에서 플레이했는지)
     */
    @Size(max = 200, message = "매장 위치는 200자 이하여야 합니다.")
    private String storeLocation;
}