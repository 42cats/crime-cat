package com.crimecat.backend.gameHistory.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckPlayResponseDto {
  private Boolean hasPlayed;

  public static CheckPlayResponseDto from (Boolean hasPlayed){
    return CheckPlayResponseDto.builder()
        .hasPlayed(hasPlayed)
        .build();
  }
}
