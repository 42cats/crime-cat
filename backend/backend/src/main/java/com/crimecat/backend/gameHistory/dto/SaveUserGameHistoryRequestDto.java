package com.crimecat.backend.gameHistory.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class SaveUserGameHistoryRequestDto {
	private String guildSnowflake;
	private String userSnowflake; // 실제로는 discordSnowflake
	private String characterName;
	private LocalDateTime createdAt;
	private boolean isWin;
}
