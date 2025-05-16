package com.crimecat.backend.gameHistory.dto;

import lombok.Builder;

@Builder
public class WebHistoryResponseDto {
  private String message;

  static public WebHistoryResponseDto from(String message){
    return WebHistoryResponseDto.builder()
        .message(message)
        .build();
  }
}
