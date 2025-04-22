package com.crimecat.backend.web.gameHistory.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class SaveUserGameHistoryRequestDto {
	private String guildSnowflake;
	private String userSnowflake;
	private String characterName;
	private LocalDateTime createdAt;
	private boolean isWin;
}
