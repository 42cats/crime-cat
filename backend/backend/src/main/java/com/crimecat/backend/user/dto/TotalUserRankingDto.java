package com.crimecat.backend.user.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type" // JSON 결과에 type 필드 추가됨
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = TotalUserRankingByPointDto.class, name = "point"),
        @JsonSubTypes.Type(value = TotalUserRankingByPlayTimeDto.class, name = "playtime"),
        @JsonSubTypes.Type(value = TotalUserRankingByMakerDto.class, name = "makers"),
        @JsonSubTypes.Type(value = TotalGuildRankingByPlayCountDto.class, name = "theme")
})

public interface TotalUserRankingDto {
}
