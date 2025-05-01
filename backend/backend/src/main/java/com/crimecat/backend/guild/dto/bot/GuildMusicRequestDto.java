package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class GuildMusicRequestDto {
    private String title;
    private String url;
    private String thumbnail;
    private String duration;
}
