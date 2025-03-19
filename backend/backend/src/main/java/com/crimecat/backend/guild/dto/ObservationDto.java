package com.crimecat.backend.guild.dto;

import com.crimecat.backend.guild.domain.Observation;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ObservationDto {
    private String guildSnowflake;
    private String headTitle;
    private String roleSnowFlake;

    public ObservationDto(Observation observation) {
        // TODO: is really required?
        this.guildSnowflake = observation.getGuild().getSnowflake();
        this.headTitle = observation.getHeadTitle();
        this.roleSnowFlake = observation.getRoleSnowflake();
    }
}
