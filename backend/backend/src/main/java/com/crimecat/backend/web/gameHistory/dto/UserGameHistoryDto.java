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
	private boolean isWin;
	private LocalDateTime createdAt;
	private String characterName;
}
