package com.crimecat.backend.gametheme.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CrimesceneThemeSummeryListDto {

  @Builder.Default
  private List<CrimesceneThemeSummeryDto> themeList = new ArrayList<>();

  static public CrimesceneThemeSummeryListDto from (List<CrimesceneThemeSummeryDto> summeryDtoList){
    if(summeryDtoList == null || summeryDtoList.isEmpty()){
      return CrimesceneThemeSummeryListDto.builder().build();
    }
    return CrimesceneThemeSummeryListDto.builder()
        .themeList(summeryDtoList)
        .build();
  }
}
