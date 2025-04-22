package com.crimecat.backend.bot.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class GuildMusicDeletedResponseDto {
    private String guildSnowflake;
    private String title;
}
