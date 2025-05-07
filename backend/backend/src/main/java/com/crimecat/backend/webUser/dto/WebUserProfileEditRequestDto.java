package com.crimecat.backend.webUser.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WebUserProfileEditRequestDto {
  private String userId;
  private String nickName;
  private Map<String,String> socialLink;
//  private String title;
//  private String badge;
  private Boolean emailAlert;
  private Boolean discordAlert;
  private String bio;
}
