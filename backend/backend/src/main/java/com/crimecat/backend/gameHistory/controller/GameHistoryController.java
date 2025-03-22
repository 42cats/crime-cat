package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.gameHistory.service.GameHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("v1/bot/histories")
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
}
