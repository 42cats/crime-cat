package com.crimecat.backend.web.gameHistory.dto;

import com.crimecat.backend.web.gameHistory.domain.GameHistory;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGameHistoryToUserDto {

	private UUID uuid;
	private String guildSnowflake;
	private String userSnowflake;
	private String guildName;
	private String playerName;
	private boolean isWin;
	private LocalDateTime createdAt;
	private String characterName;
	private String Memo;
	private String themeId;
	private String themeName;


	static public UserGameHistoryToUserDto from(GameHistory gameHistory){
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
		return new UserGameHistoryToUserDto(
				gameHistory.getId(),
				gameHistory.getGuild().getSnowflake(),
				gameHistory.getDiscordUser().getSnowflake(),
				gameHistory.getGuild().getName(),
				gameHistory.getDiscordUser().getUser().getName(),
				gameHistory.isWin(),
				gameHistory.getCreatedAt(),
				gameHistory.getCharacterName(),
				gameHistory.getMemo(),
				gameThemeId,
				gameThemeName
		);
	}
}
