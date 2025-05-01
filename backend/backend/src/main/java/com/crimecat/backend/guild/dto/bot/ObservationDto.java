package com.crimecat.backend.guild.dto.bot;

import com.crimecat.backend.guild.domain.Observation;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ObservationDto {
    private String guildSnowflake;
    private String headTitle;
    @JsonInclude(value = JsonInclude.Include.ALWAYS)
    private String roleSnowFlake;

    public ObservationDto(Observation observation) {
        this.guildSnowflake = observation.getGuildSnowflake();
        this.headTitle = observation.getHeadTitle();
        this.roleSnowFlake = observation.getRoleSnowflake();
    }
}
