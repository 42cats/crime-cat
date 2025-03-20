package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GuildDto {
    private String snowflake;
    private String name;
    private String ownerSnowflake;
}
