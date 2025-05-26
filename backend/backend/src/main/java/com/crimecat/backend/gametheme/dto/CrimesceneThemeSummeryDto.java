package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.GameTheme;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CrimesceneThemeSummeryDto {
  private String themeId;
  private String thumbNail;
  private String themeTitle;
  private Integer themePrice;
  private Integer themeMinPlayer;
  private Integer themeMaxPlayer;

  static public CrimesceneThemeSummeryDto from (GameTheme gameTheme){
    return CrimesceneThemeSummeryDto.builder()
        .themeId(gameTheme.getId().toString())
        .thumbNail(gameTheme.getThumbnail())
        .themeTitle(gameTheme.getTitle())
        .themePrice(gameTheme.getPrice())
        .themeMinPlayer(gameTheme.getPlayerMin())
        .themeMaxPlayer(gameTheme.getPlayerMax())
        .build();
  }
}
