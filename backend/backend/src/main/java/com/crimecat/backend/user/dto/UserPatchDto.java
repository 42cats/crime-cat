package com.crimecat.backend.user.dto;

import com.crimecat.backend.user.domain.DiscordUser;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
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
