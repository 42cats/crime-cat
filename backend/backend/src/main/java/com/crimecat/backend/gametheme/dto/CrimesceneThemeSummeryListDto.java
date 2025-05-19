package com.crimecat.backend.gametheme.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Builder
@AllArgsConstructor
public class CrimesceneThemeSummeryListDto {
  private List<CrimesceneThemeSummeryDto> themeList;

  static public CrimesceneThemeSummeryListDto from (List<CrimesceneThemeSummeryDto> summeryDtoList){
    return CrimesceneThemeSummeryListDto.builder()
        .themeList(summeryDtoList)
        .build();
  }
}
