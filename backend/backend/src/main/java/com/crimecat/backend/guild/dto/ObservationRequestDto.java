package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.openapitools.jackson.nullable.JsonNullable;

@Getter
@AllArgsConstructor
public class ObservationRequestDto {
    private JsonNullable<String> headTitle;
    private JsonNullable<String> roleSnowFlake;
}
