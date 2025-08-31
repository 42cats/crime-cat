package com.crimecat.backend.schedule.dto.request;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * 캘린더 설정 수정 요청 DTO
 */
@Getter
@Setter
public class CalendarUpdateRequest {

    @Size(max = 100, message = "표시 이름은 100자를 초과할 수 없습니다.")
    private String displayName;

    @Min(value = 0, message = "색상 인덱스는 0 이상이어야 합니다.")
    @Max(value = 7, message = "색상 인덱스는 7 이하여야 합니다.")
    private Integer colorIndex;

    private Boolean isActive;

    private Integer sortOrder;
}