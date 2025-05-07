package com.crimecat.backend.guild.dto.bot;

import com.crimecat.backend.guild.domain.Guild;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Setter
@NoArgsConstructor
@Builder
public class GuildDto {
    private String snowflake;
    private String name;
    private String ownerSnowflake;
    private LocalDateTime createdAt;

    public GuildDto(Guild guild) {
        this.snowflake = guild.getSnowflake();
        this.name = guild.getName();
        this.ownerSnowflake = guild.getOwnerSnowflake();
        this.createdAt = guild.getCreatedAt();
    }
    
    public static GuildDto from(Guild guild) {
        if (guild == null) {
            return null;
        }
        return GuildDto.builder()
                .snowflake(guild.getSnowflake())
                .name(guild.getName())
                .ownerSnowflake(guild.getOwnerSnowflake())
                .createdAt(guild.getCreatedAt())
                .build();
    }
}
