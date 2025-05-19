package com.crimecat.backend.webUser.dto;

import com.crimecat.backend.webUser.domain.WebUser;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@AllArgsConstructor
@Builder
@Getter
public class ProfileDetailDto {
  private String userId;
  private String userNickname;
  private String avatarImage;
  private String bio;
  private Integer point;
  private Integer playCount;
  private Map<String,String> socialLinks;

  static public ProfileDetailDto publicFrom(WebUser user, Integer playCount){
    return ProfileDetailDto.builder()
        .avatarImage(user.getProfileImagePath())
        .bio(user.getBio())
        .userId(user.getId().toString())
        .userNickname(user.getName())
        .point(user.getPoint())
        .playCount(playCount)
        .build();
  }
  static public ProfileDetailDto from(WebUser user,  Integer playCount){
    String avatarUrl = user.getProfileImagePath();
    if(avatarUrl == null){
      avatarUrl = "https://cdn.discordapp.com/embed/avatars/1.png";
    }
    return ProfileDetailDto.builder()
        .avatarImage(avatarUrl)
        .bio(user.getBio())
        .userId(user.getId().toString())
        .userNickname(user.getNickname())
        .point(user.getPoint())
        .playCount(playCount)
        .socialLinks(user.getSocialLinks())
        .build();
  }
}
