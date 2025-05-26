package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class GuildMusicListResponseDto {
    private String guildSnowflake;
    private List<GuildMusicDto> musicList;
}
