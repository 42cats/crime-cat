package com.crimecat.backend.gameHistory.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
public class WebHistoryRequestDto {
  private String message;

  static public WebHistoryRequestDto from(String message){
    return WebHistoryRequestDto.builder()
        .message(message)
        .build();
  }

}
