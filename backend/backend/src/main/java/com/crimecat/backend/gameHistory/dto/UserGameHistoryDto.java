package com.crimecat.backend.gameHistory.dto;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
public class UserGameHistoryDto {

	private UUID uuid;
	private String guildSnowflake;
	private String userSnowflake;
	private String playerName;
	private boolean isWin;
	private LocalDateTime createdAt;
	private String characterName;
	private String memo;
	private String themeId;
	private String themeName;
	private String guildName;

	static public UserGameHistoryDto from(GameHistory gameHistory){
		String gameThemeId = "";
		String gameThemeName = "등록되지 않음";

		if (gameHistory.getGameTheme() != null) {
			if (gameHistory.getGameTheme().getId() != null) {
				gameThemeId = gameHistory.getGameTheme().getId().toString();
			}
			if (gameHistory.getGameTheme().getTitle() != null && !gameHistory.getGameTheme().getTitle().isBlank()) {
				gameThemeName = gameHistory.getGameTheme().getTitle();
			}
		}

		return new UserGameHistoryDto(
				gameHistory.getId(),
				gameHistory.getGuild().getSnowflake(),
				gameHistory.getUser().getDiscordSnowflake(),
				gameHistory.getUser().getName(),
				gameHistory.isWin(),
				gameHistory.getCreatedAt(),
				gameHistory.getCharacterName(),
				gameHistory.getMemo(),
				gameThemeId,
				gameThemeName,
				gameHistory.getGuild().getName()
		);
	}
}
