package com.crimecat.backend.guild.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@AllArgsConstructor
@Getter
public class GuildMusicRequestDto {
    private String title;
    private String url;
    private String thumbnail;
    private String duration;
}
