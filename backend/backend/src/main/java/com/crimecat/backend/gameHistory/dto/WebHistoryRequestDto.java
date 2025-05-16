package com.crimecat.backend.gameHistory.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class WebHistoryRequestDto {
  private String message;

  static public WebHistoryRequestDto from(String message){
    return WebHistoryRequestDto.builder()
        .message(message)
        .build();
  }

}
