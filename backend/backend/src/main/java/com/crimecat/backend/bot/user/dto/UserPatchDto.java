package com.crimecat.backend.bot.user.dto;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPatchDto {
    private String snowflake;
    private String name;
    private String avatar;
    private boolean discordAlarm;

    public UserPatchDto(DiscordUser user) {
        this.snowflake = user.getSnowflake();
        this.name = user.getName();
        this.avatar = user.getAvatar();
        this.discordAlarm = user.isDiscordAlarm();
    }
}
