package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.service.GuildService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GameHistoryService {

	private final GameHistoryQueryService gameHistoryQueryService;
	private final UserService userService;
	private final GuildService guildService;

	@Transactional
	public SaveUserHistoryResponseDto saveUserGameHistory(
			SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {

		User user = userService.findUserBySnowflake(saveUserGameHistoryRequestDto.getUserSnowflake());
		if (user == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		Guild guild = guildService.findGuildByGuildName(saveUserGameHistoryRequestDto.getGuildSnowflake());
		if (guild == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		// TODO : 유저, 길드, 캐릭터 다 같은데 결과만 다른 기록은 새로운 기록으로 저장?
		gameHistoryQueryService.saveUserGameHistory(
				saveUserGameHistoryRequestDto.isWin(),
				saveUserGameHistoryRequestDto.getCreatedAt(),
				saveUserGameHistoryRequestDto.getCharacterName(),
				user,
				guild);

		return new SaveUserHistoryResponseDto("History recorded successfully");
	}
}
