package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class GuildMusicRequestDto {
    private String title;
    private String url;
    private String thumbnail;
    private String duration;
}
