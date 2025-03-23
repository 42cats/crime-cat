package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class ChannelRecordRequestDto {
    private String channelSnowflake;
    private String message;
}
