package com.crimecat.backend.messagemacro.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 그룹 생성 및 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupRequestDto {
    /**
     * 길드 식별자
     */
    @NotBlank
    private String guildSnowflake;

    /**
     * 그룹 이름
     */
    @NotBlank
    private String name;

    /**
     * 그룹 정렬 인덱스
     */
    @Min(0)
    private int index;
}