package com.crimecat.backend.gameHistory.service;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.guild.service.GuildQueryService;
import com.crimecat.backend.bot.guild.service.GuildService;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.service.UserService;
import com.crimecat.backend.web.gameHistory.domain.GameHistory;
import com.crimecat.backend.web.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryFailedResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistorySuccessResponseDto;
import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.web.gametheme.service.GameThemeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotGameHistoryService {

	private final GameHistoryQueryService gameHistoryQueryService;

	private final UserService userService;
	private final GuildService guildService;
	private final GuildQueryService guildQueryService;
	private final GameThemeService gameThemeService;
	private final GameThemeRepository gameThemeRepository;
	private final CrimesceneThemeRepository crimesceneThemeRepository;

	@Transactional
	public SaveUserHistoryResponseDto BotSaveCrimeSceneUserGameHistory(
			SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {

		User user = userService.findUserByDiscordSnowflake(saveUserGameHistoryRequestDto.getUserSnowflake());
		if (user == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		Guild guild = guildService.findGuildByGuildSnowflake(saveUserGameHistoryRequestDto.getGuildSnowflake());
		if (guild == null) {
			return new SaveUserHistoryResponseDto("History recorded failed");
		}

		GameHistory gameHistoryByUserSnowFlakeAndGuildSnowflake = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				user.getDiscordSnowflake(),
				guild.getSnowflake());
		if (gameHistoryByUserSnowFlakeAndGuildSnowflake != null) {
			return new SaveUserHistoryResponseDto("History already recorded");
		}

		CrimesceneTheme byGuildSnowflake = crimesceneThemeRepository.findByGuildSnowflake(
						guild.getSnowflake())
				.orElse(null);

		log.info("theme = {}", byGuildSnowflake);
		gameHistoryQueryService.saveCrimeSceneUserGameHistory(
				saveUserGameHistoryRequestDto.isWin(),
				saveUserGameHistoryRequestDto.getCreatedAt(),
				saveUserGameHistoryRequestDto.getCharacterName(),
				user,
				guild,
				byGuildSnowflake);

		return new SaveUserHistoryResponseDto("History recorded successfully");
	}

	@Transactional(readOnly = true)
	public UserGameHistoryResponseDto BotGetUserCrimeSceneGameHistoryByUserSnowflake(String discordSnowflake) {

		User user = userService.findUserByDiscordSnowflake(discordSnowflake);
		if (user == null) {
			return new UserGameHistoryFailedResponseDto("user not found");
		}

		List<UserGameHistoryDto> userGameHistoryDtos = gameHistoryQueryService.getGameHistoryByUserSnowflake(
						discordSnowflake)
				.stream()
				.map(UserGameHistoryDto::from)
				.toList();
		return new UserGameHistorySuccessResponseDto(discordSnowflake, userGameHistoryDtos);
	}

	public void BotUpdateGameHistory(String discordSnowflake, String guildSnowflake,
			GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		if (userService.findUserByDiscordSnowflake(discordSnowflake) == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user not exists");
		}
		if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
		}
		GameHistory gameHistory = gameHistoryQueryService.findGameHistoryByUserSnowFlakeAndGuildSnowflake(
				discordSnowflake, guildSnowflake);
		if (gameHistory == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "game history not exists");
		}
		gameHistory.setCreatedAt(gameHistoryUpdateRequestDto.getCreatedAt());
		gameHistory.setIsWin(gameHistoryUpdateRequestDto.getWin());
		gameHistory.setCharacterName(gameHistoryUpdateRequestDto.getCharacterName());
		gameHistoryQueryService.save(gameHistory);
	}
}