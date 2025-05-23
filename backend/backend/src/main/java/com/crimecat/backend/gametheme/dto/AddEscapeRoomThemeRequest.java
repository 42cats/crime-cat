package com.crimecat.backend.gametheme.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 방탈출 테마 생성 요청 DTO
 */
@Getter
@Setter
public class AddEscapeRoomThemeRequest extends AddGameThemeRequest {

    /**
     * 장르 태그들 (필수, 최소 1개 이상)
     * 예: ["공포", "추리", "액션", "판타지"] 등
     */
    @NotNull(message = "장르 태그는 필수입니다.")
    @NotEmpty(message = "최소 1개 이상의 장르 태그가 필요합니다.")
    @Size(max = 10, message = "장르 태그는 최대 10개까지 등록 가능합니다.")
    private Set<@NotBlank(message = "장르 태그는 공백일 수 없습니다.") 
               @Size(max = 20, message = "각 장르 태그는 20자 이하여야 합니다.") String> genreTags;

    /**
     * 공포도 (1-10, 별 5개 표시용)
     * null 허용 (공포 요소가 없는 경우)
     */
    @Min(value = 1, message = "공포도는 1 이상이어야 합니다.")
    @Max(value = 10, message = "공포도는 10 이하여야 합니다.")
    private Integer horrorLevel;

    /**
     * 장치비중 (1-10, 별 5개 표시용)
     * null 허용
     */
    @Min(value = 1, message = "장치비중은 1 이상이어야 합니다.")
    @Max(value = 10, message = "장치비중은 10 이하여야 합니다.")
    private Integer deviceRatio;

    /**
     * 활동도 (1-10, 별 5개 표시용)
     * null 허용
     */
    @Min(value = 1, message = "활동도는 1 이상이어야 합니다.")
    @Max(value = 10, message = "활동도는 10 이하여야 합니다.")
    private Integer activityLevel;

    /**
     * 오픈날짜
     */
    private LocalDate openDate;

    /**
     * 현재 운용여부 (기본값: true)
     */
    @NotNull(message = "운용여부는 필수입니다.")
    private Boolean isOperating = true;

    /**
     * 매장 위치 정보들 (최소 1개 이상 필수)
     */
    @NotNull(message = "매장 정보는 필수입니다.")
    @NotEmpty(message = "최소 1개 이상의 매장이 등록되어야 합니다.")
    @Valid
    private List<EscapeRoomLocation> locations;

    /**
     * 추가 정보 (확장용)
     */
    private Map<String, Object> extra;

    // === Validation 메서드 ===

    /**
     * 위치 정보 유효성 검증
     */
    @AssertTrue(message = "모든 매장의 위치 정보가 올바르게 입력되어야 합니다.")
    public boolean isValidLocations() {
        if (locations == null || locations.isEmpty()) {
            return false;
        }

        return locations.stream().allMatch(location -> 
            location.getStoreName() != null && !location.getStoreName().trim().isEmpty() &&
            location.getAddress() != null && !location.getAddress().trim().isEmpty() &&
            location.getLat() != null && location.getLng() != null
        );
    }

    /**
     * 별점 범위 검증 (1-10)
     */
    @AssertTrue(message = "별점 값들은 1-10 범위여야 합니다.")
    public boolean isValidStarRatings() {
        return (horrorLevel == null || (horrorLevel >= 1 && horrorLevel <= 10)) &&
               (deviceRatio == null || (deviceRatio >= 1 && deviceRatio <= 10)) &&
               (activityLevel == null || (activityLevel >= 1 && activityLevel <= 10));
    }
}