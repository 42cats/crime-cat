package com.crimecat.backend.web.gameHistory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameHistoryUpdateRequestDto {
    private String characterName;
    private Boolean isWin;
}
