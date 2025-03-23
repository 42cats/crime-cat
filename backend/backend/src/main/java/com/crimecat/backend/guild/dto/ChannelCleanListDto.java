package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
@Getter
public class ChannelCleanListDto {
    private String guildSnowflake;
    private List<String> channels;
}
