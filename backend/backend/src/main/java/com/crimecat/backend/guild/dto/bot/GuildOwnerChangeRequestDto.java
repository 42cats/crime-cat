package com.crimecat.backend.guild.dto.bot;

import lombok.Data;

@Data
public class GuildOwnerChangeRequestDto {
  private String guildSnowflake;
  private String newOwnerSnowflake;
  private String oldOwnerSnowflake;
}
