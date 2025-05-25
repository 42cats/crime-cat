package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 방탈출 테마 수정 요청 DTO
 */
@Getter
@Setter
public class UpdateEscapeRoomThemeRequest extends UpdateGameThemeRequest {



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
     * 홈페이지 URL (선택사항)
     */
    @Pattern(
        regexp = "^(https?://).*$|^$", 
        message = "홈페이지 URL은 http:// 또는 https://로 시작해야 합니다."
    )
    @Size(max = 500, message = "홈페이지 URL은 500자 이하여야 합니다.")
    private String homepageUrl;

    /**
     * 예약 페이지 URL (선택사항)
     */
    @Pattern(
        regexp = "^(https?://).*$|^$", 
        message = "예약 페이지 URL은 http:// 또는 https://로 시작해야 합니다."
    )
    @Size(max = 500, message = "예약 페이지 URL은 500자 이하여야 합니다.")
    private String reservationUrl;

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

    /**
     * EscapeRoomTheme 엔티티 업데이트
     */
    @Override
    public void update(GameTheme gameTheme) {
        // 부모 클래스의 기본 필드 업데이트
        super.update(gameTheme);
        
        // EscapeRoomTheme로 캐스팅하여 방탈출 전용 필드 업데이트
        if (gameTheme instanceof EscapeRoomTheme escapeRoomTheme) {
            // 방탈출 특성 업데이트
            set(horrorLevel, escapeRoomTheme::setHorrorLevel);
            set(deviceRatio, escapeRoomTheme::setDeviceRatio);
            set(activityLevel, escapeRoomTheme::setActivityLevel);
            set(openDate, escapeRoomTheme::setOpenDate);
            set(isOperating, escapeRoomTheme::setIsOperating);
            

            
            // 매장 위치 업데이트
            if (locations != null) {
                escapeRoomTheme.updateLocations(locations);
            }
            
            // URL 정보 업데이트
            escapeRoomTheme.updateUrls(homepageUrl, reservationUrl);
            
            // 추가 정보 업데이트
            if (extra != null) {
                Map<String, Object> currentExtra = escapeRoomTheme.getExtra();
                if (currentExtra == null) {
                    currentExtra = new HashMap<>();
                }
                
                // URL 정보 보존하면서 추가 정보 병합
                String existingHomepage = (String) currentExtra.get("homepageUrl");
                String existingReservation = (String) currentExtra.get("reservationUrl");
                
                currentExtra.putAll(extra);
                
                // URL 정보가 별도로 제공되지 않은 경우 기존 값 유지
                if (homepageUrl == null && existingHomepage != null) {
                    currentExtra.put("homepageUrl", existingHomepage);
                }
                if (reservationUrl == null && existingReservation != null) {
                    currentExtra.put("reservationUrl", existingReservation);
                }
                
                escapeRoomTheme.setExtra(currentExtra);
            }
        }
    }
}