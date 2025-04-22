package com.crimecat.backend.bot.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@AllArgsConstructor
@Getter
public class GuildMusicDto {
    private String title;
    private String youtubeUrl;
    private String thumbnail;
    private String duration;
    private LocalDateTime createdAt;
}
