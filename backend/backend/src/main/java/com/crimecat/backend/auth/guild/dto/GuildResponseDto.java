package com.crimecat.backend.auth.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuildResponseDto {
    private List<GuildBotInfoDto> guilds;
}
