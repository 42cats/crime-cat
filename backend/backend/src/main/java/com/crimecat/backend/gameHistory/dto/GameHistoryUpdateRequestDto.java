package com.crimecat.backend.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameHistoryUpdateRequestDto {
    private String characterName;
    private Boolean isWin;
}
