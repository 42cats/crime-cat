package com.crimecat.backend.schedule.dto.request;

import lombok.Getter;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/**
 * 새 캘린더 추가 요청 DTO
 */
@Getter
@Setter
public class CalendarCreateRequest {

    @NotBlank(message = "iCalendar URL은 필수입니다.")
    @Pattern(regexp = "^https?://.*", message = "유효한 HTTP/HTTPS URL이어야 합니다.")
    @Size(max = 2048, message = "URL은 2048자를 초과할 수 없습니다.")
    private String icalUrl;

    @Size(max = 100, message = "표시 이름은 100자를 초과할 수 없습니다.")
    private String displayName;
}