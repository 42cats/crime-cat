package com.crimecat.backend.guild.dto;

import com.crimecat.backend.guild.domain.Guild;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@AllArgsConstructor
@Setter
@NoArgsConstructor
public class GuildDto {
    private String snowflake;
    private String name;
    private String ownerSnowflake;

    public GuildDto(Guild guild) {
        this.snowflake = guild.getSnowflake();
        this.name = guild.getName();
        this.ownerSnowflake = guild.getOwnerSnowflake();
    }
}
