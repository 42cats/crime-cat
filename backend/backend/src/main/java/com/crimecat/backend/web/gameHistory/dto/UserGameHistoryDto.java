package com.crimecat.backend.web.gameHistory.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHistoryDto {

	private UUID uuid;
	private String guildSnowflake;
	private String playerName;
	private boolean isWin;
	private LocalDateTime createdAt;
	private String characterName;
	private String memo;
	private String themeId;
	private String themeName;
}
