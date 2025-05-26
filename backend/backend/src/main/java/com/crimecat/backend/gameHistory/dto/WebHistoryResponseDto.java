package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class WebHistoryResponseDto {
  private String message;

  static public WebHistoryResponseDto from(String message){
    return WebHistoryResponseDto.builder()
        .message(message)
        .build();
  }
}
