package com.crimecat.backend.web.gameHistory.controller;

import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.web.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.service.BotGameHistoryService;
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
	 * @param userSnowflake
	 * @return
	 */
	@GetMapping("/crime_scene/{user_snowflake}")
	public UserGameHistoryResponseDto getUserGameHistoryByUserSnowflake(@PathVariable("user_snowflake") String userSnowflake) {
		return gameHistoryService.BotGetUserCrimeSceneGameHistoryByUserSnowflake(userSnowflake);
	}

	@PatchMapping("/crime_scene/{user_snowflake}/guild/{guild_snowflake}")
	public MessageDto<?> updateUserGameHistory(@PathVariable("user_snowflake") String userSnowflake,
											   @PathVariable("guild_snowflake") String guildSnowflake,
											   @RequestBody GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		gameHistoryService.BotUpdateGameHistory(userSnowflake, guildSnowflake, gameHistoryUpdateRequestDto);
		return new MessageDto<>("History updated successfully");
	}
}
