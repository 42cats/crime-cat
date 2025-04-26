package com.crimecat.backend.web.gameHistory.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameHistoryUpdateRequestDto {
    private String characterName;
    private Boolean win;
    private String memo;
    private LocalDateTime createdAt;
}
