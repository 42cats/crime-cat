package com.crimecat.backend.web.gameHistory.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.util.sort.SortUtil;
import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.web.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.web.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryResponseDto;
import com.crimecat.backend.web.gameHistory.dto.UserGameHistoryToOwnerDto;
import com.crimecat.backend.web.gameHistory.service.GameHistoryService;
import com.crimecat.backend.web.gameHistory.sort.GameHistorySortType;
import com.crimecat.backend.web.webUser.domain.WebUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/histories")
public class WebGameHistoryController {

	private final GameHistoryService gameHistoryService;

	/**
	 * 유저의 게임 기록을 저장
	 * @param saveUserGameHistoryRequestDto
	 * @return
	 */
	@PostMapping("/crime_scene")
	public SaveUserHistoryResponseDto saveUserHistory(
			@RequestBody SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {
		return gameHistoryService.saveCrimeSceneUserGameHistory(saveUserGameHistoryRequestDto);
	}

	/**
	 * 특정 유저의 게임 기록 조회
	 * @param webuserId
	 * @return
	 */
	@GetMapping("/crime_scene/my/{web_user_id}")
	public UserGameHistoryResponseDto getUserGameHistoryByUserSnowflake(@PathVariable("web_user_id") String webuserId) {
		return gameHistoryService.getUserCrimeSceneGameHistoryByUserSnowflake(webuserId);
	}

	@PatchMapping("/crime_scene/{user_snowflake}/guild/{guild_snowflake}")
	public MessageDto<?> updateUserGameHistory(@PathVariable("user_snowflake") String userSnowflake,
											   @PathVariable("guild_snowflake") String guildSnowflake,
											   @RequestBody GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		DiscordOAuth2User principal = (DiscordOAuth2User) authentication.getPrincipal();
		WebUser webUser = principal.getWebUser();
		gameHistoryService.updateGameHistoryOnWeb(webUser, userSnowflake, guildSnowflake, gameHistoryUpdateRequestDto);
		return new MessageDto<>("History updated successfully");
	}

	@GetMapping("/crime_scene/owner/{guild_id}")
	public ResponseEntity<Page<UserGameHistoryToOwnerDto>> crimeSceneGuildHistory(
			@PathVariable("guild_id") String guidId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) List<String> sort){
		List<GameHistorySortType> sortTypes = (sort != null && !sort.isEmpty()) ?
				sort.stream()
						.map(String::toUpperCase)
						.map(GameHistorySortType::valueOf)
						.toList()
				: List.of(GameHistorySortType.LATEST);

		Sort resolvedSort = SortUtil.combineSorts(sortTypes);
		Pageable pageable = PageRequest.of(page, size, resolvedSort);

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		DiscordOAuth2User principal = (DiscordOAuth2User) authentication.getPrincipal();
		WebUser webUser = principal.getWebUser();
		return ResponseEntity.ok().body(gameHistoryService.getGuildOwnerHistory(webUser.getUser(), guidId, pageable));
	}
}
