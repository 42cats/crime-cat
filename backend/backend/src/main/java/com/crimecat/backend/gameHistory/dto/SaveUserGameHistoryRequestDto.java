package com.crimecat.backend.gameHistory.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class SaveUserGameHistoryRequestDto {
	private String guildSnowflake;
	private String userSnowflake; // 실제로는 discordSnowflake
	private String characterName;
	private LocalDateTime createdAt;
	private boolean isWin;
}
