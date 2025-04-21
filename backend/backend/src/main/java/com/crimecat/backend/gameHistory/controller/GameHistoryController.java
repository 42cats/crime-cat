package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.gameHistory.service.GameHistoryService;
import com.crimecat.backend.guild.dto.MessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/histories")
public class GameHistoryController {

	private final GameHistoryService gameHistoryService;

	/**
	 * 유저의 게임 기록을 저장
	 * @param saveUserGameHistoryRequestDto
	 * @return
	 */
	@PostMapping("")
	public SaveUserHistoryResponseDto saveUserHistory(
			@RequestBody SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {
		return gameHistoryService.saveUserGameHistory(saveUserGameHistoryRequestDto);
	}

	/**
	 * 특정 유저의 게임 기록 조회
	 * @param userSnowflake
	 * @return
	 */
	@GetMapping("{user_snowflake}")
	public UserGameHistoryResponseDto getUserGameHistoryByUserSnowflake(@PathVariable("user_snowflake") String userSnowflake) {
		return gameHistoryService.getUserGameHistoryByUserSnowflake(userSnowflake);
	}

	@PatchMapping("{user_snowflake}/guild/{guild_snowflake}")
	public MessageDto<?> updateUserGameHistory(@PathVariable("user_snowflake") String userSnowflake,
											   @PathVariable("guild_snowflake") String guildSnowflake,
											   @RequestBody GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		gameHistoryService.updateGameHistory(userSnowflake, guildSnowflake, gameHistoryUpdateRequestDto);
		return new MessageDto<>("History updated successfully");
	}
}
