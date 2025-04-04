package com.crimecat.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPatchRequestDto {
    private String avatar;
    private Boolean discordAlarm;
}
