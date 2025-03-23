package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class ChannelCleanDto {
    private String guildSnowflake;
    private String channelSnowflake;
}
