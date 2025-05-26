package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ObservationPatchRequestDto {
    private JsonNullable<String> headTitle;
    private JsonNullable<String> roleSnowFlake;
}
