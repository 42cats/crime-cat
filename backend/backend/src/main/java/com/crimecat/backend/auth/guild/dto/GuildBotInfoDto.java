package com.crimecat.backend.auth.guild.dto;

import lombok.Data;

@Data
public class GuildBotInfoDto {
    private String id;
    private String name;
    private Integer approximate_member_count;
    private Integer approximate_presence_count;
}
