package com.crimecat.backend.webUser.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsRequestDto {
  private Boolean email;
  private Boolean discord;
  private Boolean post;
  private Boolean comment;
  private Boolean commentComment;
}
