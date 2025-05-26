package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.validator.MinMaxCheck;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.HashSet;
import java.util.Set;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Range;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXTERNAL_PROPERTY,
        property = "type"  // 이 필드를 기반으로 자식 클래스를 구분
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = AddCrimesceneThemeRequest.class, name = ThemeType.Values.CRIMESCENE),
        @JsonSubTypes.Type(value = AddEscapeRoomThemeRequest.class, name = ThemeType.Values.ESCAPE_ROOM),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@MinMaxCheck(min = "playerMin", max = "playerMax", message = "인원수 최소값이 최대값보다 큽니다.")
@MinMaxCheck(min = "playtimeMin", max = "playtimeMax", message = "플레이 시간 최소값이 최대값보다 큽니다.")
public class AddGameThemeRequest {
    @NotBlank
    private String title; //"테마 제목"
    @NotBlank
    private String summary; // 간략 설명
    @Size(min = 1)
    private Set<String> tags = new HashSet<>(); // 태그 배열
    @NotBlank
    private String content; // 게시글 본문
    @Min(1)
    private int playerMin; // 최소 인원수
    private int playerMax;
    @Min(1)
    private int playtimeMin; // 소요시간 (분)
    private int playtimeMax; // 소요시간 (분)
    @Min(0)
    private int price; // 금액 (원화)
    @Range(min = 1, max = 10)
    private int difficulty; // 난이도 1~5
    private boolean publicStatus; // 공개 여부
    private boolean recommendationEnabled;
    private boolean commentEnabled;
}
