package com.crimecat.backend.user.dto;

import com.crimecat.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPatchDto {
    private String snowflake;
    private String name;
    private String avatar;
    private boolean discordAlarm;

    public UserPatchDto(User user) {
        this.snowflake = user.getSnowflake();
        this.name = user.getName();
        this.avatar = user.getAvatar();
        this.discordAlarm = user.isDiscordAlarm();
    }
}
