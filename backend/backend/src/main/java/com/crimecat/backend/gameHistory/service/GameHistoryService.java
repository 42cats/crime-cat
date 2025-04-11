package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.dto.*;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.service.GuildQueryService;
import com.crimecat.backend.guild.service.GuildService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class GameHistoryService {

	private final GameHistoryQueryService gameHistoryQueryService;

	private final UserService userService;
	private final GuildService guildService;
	private final GuildQueryService guildQueryService;

	@Transactional
	public SaveUserHistoryResponseDto saveUserGameHistory(
			SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {

		User user = userService.findUserBySnowflake(saveUserGameHistoryRequestDto.getUserSnowflake());
		if (user == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(saveUserGameHistoryRequestDto.getGuildSnowflake());
		if (guild == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		GameHistory gameHistoryByUserSnowFlakeAndGuildSnowflake = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				user.getSnowflake(),
				guild.getSnowflake());
		if (gameHistoryByUserSnowFlakeAndGuildSnowflake != null) {
			return new SaveUserHistoryResponseDto("History already recorded");
		}

		gameHistoryQueryService.saveUserGameHistory(
				saveUserGameHistoryRequestDto.isWin(),
				saveUserGameHistoryRequestDto.getCreatedAt(),
				saveUserGameHistoryRequestDto.getCharacterName(),
				user,
				guild);

		return new SaveUserHistoryResponseDto("History recorded successfully");
	}

	@Transactional(readOnly = true)
	public UserGameHistoryResponseDto getUserGameHistoryByUserSnowflake(String userSnowflake) {

		User user = userService.findUserBySnowflake(userSnowflake);
		if (user == null) {
			return new UserGameHistoryFailedResponseDto("user not found");
		}

		List<UserGameHistoryDto> userGameHistoryDtos = gameHistoryQueryService.getGameHistoryByUserSnowflake(
						userSnowflake)
				.stream()
				.map(gh -> new UserGameHistoryDto(gh.getId(), gh.getGuild().getSnowflake(),
						gh.isWin(), gh.getCreatedAt(), gh.getCharacterName()))
				.toList();
		return new UserGameHistorySuccessResponseDto(userSnowflake, userGameHistoryDtos);
	}

    public void updateGameHistory(String userSnowflake, String guildSnowflake,
								  GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		if (userService.findUserBySnowflake(userSnowflake) == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user not exists");
		}
		if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
		}
		GameHistory gameHistory = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				userSnowflake, guildSnowflake);
		if (gameHistory == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "game history not exists");
		}
		gameHistory.setIsWin(gameHistoryUpdateRequestDto.getIsWin());
		gameHistory.setCharacterName(gameHistoryUpdateRequestDto.getCharacterName());
		gameHistoryQueryService.save(gameHistory);
    }
}
