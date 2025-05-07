package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.Optional;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class NotificationSettingsResponseDto {
  private Boolean email;
  private Boolean discord;

  static public NotificationSettingsResponseDto from(WebUser webUser){
    Boolean discord = Optional.ofNullable(webUser.getUser().getDiscordUser())
        .map(DiscordUser::isDiscordAlarm)
        .orElse(false);
    return NotificationSettingsResponseDto.builder()
        .discord(discord)
        .email(webUser.getEmailAlarm())
        .build();
    }
}

