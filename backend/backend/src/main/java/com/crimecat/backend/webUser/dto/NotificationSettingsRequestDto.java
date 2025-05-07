package com.crimecat.backend.webUser.dto;

import lombok.Getter;

@Getter
public class NotificationSettingsRequestDto {
  private Boolean email;
  private Boolean discord;
}
