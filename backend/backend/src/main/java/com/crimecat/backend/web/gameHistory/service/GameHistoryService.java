package com.crimecat.backend.web.gameHistory.service;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.bot.guild.service.GuildQueryService;
import com.crimecat.backend.bot.guild.service.GuildService;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.service.UserService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.gameHistory.domain.GameHistory;
import com.crimecat.backend.web.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryFailedResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistorySuccessResponseDto;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.web.gametheme.service.GameThemeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
	private final GameThemeService gameThemeService;
	private final GameThemeRepository gameThemeRepository;
	private final GuildRepository guildRepository;
	private final GameHistoryRepository gameHistoryRepository;

	@Transactional
	public SaveUserHistoryResponseDto saveCrimeSceneUserGameHistory(
			SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {

		DiscordUser user = userService.findUserBySnowflake(saveUserGameHistoryRequestDto.getUserSnowflake());
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

		CrimesceneTheme byGuildSnowflake = gameThemeRepository.findByGuildSnowflake(
				guild.getSnowflake())
				.orElse(null);

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
	public UserGameHistoryResponseDto getUserCrimeSceneGameHistoryByUserSnowflake(String userSnowflake) {

		DiscordUser user = userService.findUserBySnowflake(userSnowflake);
		if (user == null) {
			return new UserGameHistoryFailedResponseDto("user not found");
		}

		List<UserGameHistoryDto> userGameHistoryDtos = gameHistoryQueryService.getGameHistoryByUserSnowflake(
						userSnowflake)
				.stream()
				.map(gh -> new UserGameHistoryDto(gh.getId(), gh.getGuild().getSnowflake(),gh.getUser().getUser().getName(),
						gh.isWin(), gh.getCreatedAt(), gh.getCharacterName(),gh.getMemo(),gh.getGameTheme().getId().toString(),gh.getGameTheme().getTitle()))
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
		gameHistory.setMemo(gameHistoryUpdateRequestDto.getMemo());
		gameHistoryQueryService.save(gameHistory);
    }

	public Page<UserGameHistoryDto> getGuildOwnerHistory(User owner,String guildSnowflake, Pageable pageable) {

		Guild guild = guildRepository.findBySnowflake(guildSnowflake).orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asServiceException);
		if(!guild.getOwnerSnowflake().equals(owner.getDiscordSnowflake())){
			throw ErrorStatus.NOT_GUILD_OWNER.asServiceException();
		}
		Page<UserGameHistoryDto> mappedPage = gameHistoryRepository.findByGuild_Snowflake(guildSnowflake, pageable)
				.map(v -> new UserGameHistoryDto(
						v.getId(),
						v.getGuild().getSnowflake(),
						v.getUser().getUser().getName(),
						v.isWin(),
						v.getCreatedAt(),
						v.getCharacterName(),
						v.getMemo(),
						v.getGameTheme() != null ? v.getGameTheme().getId().toString() : null,
						v.getGameTheme() != null ? v.getGameTheme().getTitle() : null
				));
		return mappedPage;
	}
}
