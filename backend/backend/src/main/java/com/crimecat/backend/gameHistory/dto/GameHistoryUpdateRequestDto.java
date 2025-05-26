package com.crimecat.backend.gameHistory.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class GameHistoryUpdateRequestDto {
    private String characterName;
    private Boolean win;
    private String memo;
    private LocalDateTime createdAt;
}
