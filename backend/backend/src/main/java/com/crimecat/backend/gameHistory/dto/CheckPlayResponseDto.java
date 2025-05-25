package com.crimecat.backend.gameHistory.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CheckPlayResponseDto {
  private Boolean hasPlayed;

  public static CheckPlayResponseDto from (Boolean hasPlayed){
    return CheckPlayResponseDto.builder()
        .hasPlayed(hasPlayed)
        .build();
  }
}
