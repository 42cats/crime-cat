package com.crimecat.backend.bot.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPatchRequestDto {
    private String avatar;
    private Boolean discordAlarm;
}
