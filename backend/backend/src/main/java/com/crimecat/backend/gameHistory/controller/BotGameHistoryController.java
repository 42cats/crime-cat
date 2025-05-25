package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.gameHistory.service.BotGameHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/histories")
public class BotGameHistoryController {

	private final BotGameHistoryService gameHistoryService;

	/**
	 * 유저의 게임 기록을 저장
	 * @param saveUserGameHistoryRequestDto
	 * @return
	 */
	@PostMapping("/crime_scene")
	public SaveUserHistoryResponseDto saveUserHistory(
			@RequestBody SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {
		return gameHistoryService.BotSaveCrimeSceneUserGameHistory((saveUserGameHistoryRequestDto));
	}

	/**
	 * 특정 유저의 게임 기록 조회
	 * @param discordSnowflake
	 * @return
	 */
	@GetMapping("/crime_scene/{user_snowflake}")
	public UserGameHistoryResponseDto getUserGameHistoryByUserSnowflake(@PathVariable("user_snowflake") String discordSnowflake) {
		return gameHistoryService.BotGetUserCrimeSceneGameHistoryByUserSnowflake(discordSnowflake);
	}

	@PatchMapping("/crime_scene/{user_snowflake}/guild/{guild_snowflake}")
	public MessageDto<?> updateUserGameHistory(@PathVariable("user_snowflake") String discordSnowflake,
	@PathVariable("guild_snowflake") String guildSnowflake,
	@RequestBody GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
	gameHistoryService.BotUpdateGameHistory(discordSnowflake, guildSnowflake, gameHistoryUpdateRequestDto);
	return new MessageDto<>("History updated successfully");
	}
}
