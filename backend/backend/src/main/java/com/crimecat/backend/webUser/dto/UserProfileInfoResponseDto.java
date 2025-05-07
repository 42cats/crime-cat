package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileInfoResponseDto {
  private String id;
  private String nickName;
  private String bio;
//  private String badge;
  private String avatar;
  private Map<String,String> socialLinks; // 필드명 수정: socialLick -> socialLinks
  private Map<String,Boolean> notificationSettings;

  static public UserProfileInfoResponseDto from(WebUser webUser) {
    Map<String, Boolean> alertSetting = new HashMap<>();
    if (webUser.getUser().getDiscordUser() != null) {
      alertSetting.put("discord", webUser.getUser().getDiscordUser().isDiscordAlarm());
    }
    alertSetting.put("email", webUser.getEmailAlarm());
    return UserProfileInfoResponseDto.builder()
            .id(webUser.getId().toString())
            .nickName(webUser.getNickname())
            .bio(webUser.getBio())
            .avatar(webUser.getProfileImagePath())
            .notificationSettings(alertSetting)
            .socialLinks(webUser.getSocialLinks()) // 필드명 수정: socialLick -> socialLinks
            .build();
  }
}

