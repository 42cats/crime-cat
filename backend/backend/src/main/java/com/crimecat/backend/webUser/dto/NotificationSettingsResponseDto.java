package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.Optional;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationSettingsResponseDto {
  private Boolean email;
  private Boolean discord;
  private Boolean post;
  private Boolean postComment;
  private Boolean commentComment;

  static public NotificationSettingsResponseDto from(WebUser webUser){
    Boolean discord = Optional.ofNullable(webUser.getUser().getDiscordUser())
        .map(DiscordUser::isDiscordAlarm)
        .orElse(false);
    return NotificationSettingsResponseDto.builder()
        .discord(discord)
        .email(webUser.getEmailAlarm())
            .post(webUser.getPostAlarm())
            .commentComment(webUser.getCommentComment())
            .postComment(webUser.getPostComment())
        .build();
    }
}

