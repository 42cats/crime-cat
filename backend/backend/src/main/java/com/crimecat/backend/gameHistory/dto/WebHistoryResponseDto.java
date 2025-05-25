package com.crimecat.backend.gameHistory.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class WebHistoryResponseDto {
  private String message;

  static public WebHistoryResponseDto from(String message){
    return WebHistoryResponseDto.builder()
        .message(message)
        .build();
  }
}
