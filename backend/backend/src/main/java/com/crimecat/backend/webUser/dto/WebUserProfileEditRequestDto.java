package com.crimecat.backend.webUser.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Builder
@Setter
@AllArgsConstructor
public class WebUserProfileEditRequestDto {
  private String userId;
  @JsonProperty("nickname")
  private String nickName;
  private Map<String,String> socialLinks;
//  private String title;
//  private String badge;
  private Boolean emailAlert;
  private Boolean discordAlert;
  private String bio;
}
