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
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryToOwnerDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryToUserDto;
import com.crimecat.backend.web.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.web.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.web.gametheme.repository.GameThemeRepository;
import com.crimecat.backend.web.gametheme.service.GameThemeService;
import com.crimecat.backend.web.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WebGameHistoryService {

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
	public Page<UserGameHistoryToUserDto> getUserCrimeSceneGameHistoryByDiscordUserSnowflake(String userSnowflake, Pageable pageable, String keyword) {

		DiscordUser user = userService.findUserBySnowflake(userSnowflake);
		if (user == null) {
			throw  ErrorStatus.USER_NOT_FOUND.asServiceException();
		}
		return gameHistoryRepository.findByDiscordUserSnowflakeAndKeyword(userSnowflake,keyword, pageable).map(UserGameHistoryToUserDto::from);
	}

		@Transactional(readOnly = true)
	public Page<UserGameHistoryToOwnerDto> WebGetGuildOwnerHistory(User owner,String guildSnowflake, Pageable pageable) {

		Guild guild = guildRepository.findBySnowflake(guildSnowflake).orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asServiceException);
		if(!guild.getOwnerSnowflake().equals(owner.getDiscordSnowflake())){
			throw ErrorStatus.NOT_GUILD_OWNER.asServiceException();
		}
			Page<GameHistory> page = gameHistoryRepository.searchByGuild_Snowflake(guildSnowflake, pageable);

		return page.map(UserGameHistoryToOwnerDto::from);
	}

	@Transactional
	public void WebUpdateGameHistory(WebUser webUser,String userSnowflake, String guildSnowflake,
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
		if (
				!gameHistory.getDiscordUser().getSnowflake().equals(webUser.getDiscordUserSnowflake()) &&
						!gameHistory.getGuild().getOwnerSnowflake().equals(webUser.getDiscordUserSnowflake())
		) {
			throw ErrorStatus.INVALID_ACCESS.asServiceException();  //플레이한 유저도 아니고 오너도 아닐경우
		}

// 공통: 승패, 캐릭터명 수정
		gameHistory.setIsWin(gameHistoryUpdateRequestDto.getWin());
		gameHistory.setCharacterName(gameHistoryUpdateRequestDto.getCharacterName());
		gameHistory.setCreatedAt(gameHistoryUpdateRequestDto.getCreatedAt());
// 분기: 메모 수정
		if (gameHistory.getGuild().getOwnerSnowflake().equals(webUser.getDiscordUserSnowflake())) {
			// 오너라면
			gameHistory.setOwnerMemo(gameHistoryUpdateRequestDto.getMemo());
		} else {
			// 플레이어라면
			gameHistory.setMemo(gameHistoryUpdateRequestDto.getMemo());
		}

		gameHistoryQueryService.save(gameHistory);
	}

}
