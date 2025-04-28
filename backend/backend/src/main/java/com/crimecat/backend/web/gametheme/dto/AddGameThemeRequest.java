package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.ThemeType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.Set;
import java.util.UUID;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXTERNAL_PROPERTY,
        property = "type"  // 이 필드를 기반으로 자식 클래스를 구분
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = AddCrimesceneThemeRequest.class, name = ThemeType.Values.CRIMESCENE),
})
@Data
public class AddGameThemeRequest {
    private String title; //"테마 제목"
    private String summary; // 간략 설명
    private Set<String> tags; // 태그 배열
    private String content; // 게시글 본문
    private int playerMin; // 최소 인원수
    private int playerMax;
    private int playtimeMin; // 소요시간 (분)
    private int playtimeMax; // 소요시간 (분)
    private int price; // 금액 (원화)
    private int difficulty; // 난이도 1~10
    private boolean publicStatus; // 공개 여부
    private String type;
}
