package com.crimecat.backend.gameHistory.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.dto.CheckPlayResponseDto;
import com.crimecat.backend.gameHistory.dto.GameHistoryUpdateRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserGameHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.SaveUserHistoryResponseDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToOwnerDto;
import com.crimecat.backend.gameHistory.dto.UserGameHistoryToUserDto;
import com.crimecat.backend.gameHistory.dto.WebHistoryRequestDto;
import com.crimecat.backend.gameHistory.dto.WebHistoryResponseDto;
import com.crimecat.backend.gameHistory.service.WebGameHistoryService;
import com.crimecat.backend.gameHistory.sort.GameHistorySortType;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.utils.sort.SortUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/histories")
public class WebGameHistoryController {

	private final WebGameHistoryService webGameHistoryService;

	/**
	 * 유저의 게임 기록을 저장
	 * @param saveUserGameHistoryRequestDto
	 * @return
	 */
	@PostMapping("/crime_scene")
	public SaveUserHistoryResponseDto saveUserHistory(
			@RequestBody SaveUserGameHistoryRequestDto saveUserGameHistoryRequestDto) {
		return webGameHistoryService.saveCrimeSceneUserGameHistory(saveUserGameHistoryRequestDto);
	}

	/**
	 * 특정 유저의 게임 기록 조회
	 * @param webuserId
	 * @return
	 */
	@GetMapping("/crime_scene/user/{web_user_id}")
	public ResponseEntity<Page<UserGameHistoryToUserDto>> getUserGameHistoryByUserSnowflake(
			@PathVariable("web_user_id") String webuserId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) List<String> sort,
			@RequestParam(name = "query", required = false) String keyword // ✅
	) {
		WebUser webUser = AuthenticationUtil.getCurrentWebUser();
		if(!webuserId.equals(webUser.getId().toString())){
			throw ErrorStatus.INVALID_ACCESS.asControllerException();
		}
		List<GameHistorySortType> sortTypes = (sort != null && !sort.isEmpty()) ?
				sort.stream()
						.map(String::toUpperCase)
						.map(GameHistorySortType::valueOf)
						.toList()
				: List.of(GameHistorySortType.LATEST);

		Sort resolvedSort = SortUtil.combineSorts(sortTypes);
		Pageable pageable = PageRequest.of(page, size, resolvedSort);

		return ResponseEntity.ok().body(webGameHistoryService.getUserCrimeSceneGameHistoryByDiscordUserSnowflake(webUser.getDiscordUserSnowflake(), pageable, keyword));
	}

	@PatchMapping("/crime_scene/{user_snowflake}/guild/{guild_snowflake}")
	public MessageDto<?> updateUserGameHistory(@PathVariable("user_snowflake") String discordSnowflake,
	@PathVariable("guild_snowflake") String guildSnowflake,
	@RequestBody GameHistoryUpdateRequestDto gameHistoryUpdateRequestDto) {
	WebUser webUser = AuthenticationUtil.getCurrentWebUser();
	webGameHistoryService.WebUpdateGameHistory(webUser, discordSnowflake, guildSnowflake, gameHistoryUpdateRequestDto);
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

		WebUser webUser = AuthenticationUtil.getCurrentWebUser();
		return ResponseEntity.ok().body(
				webGameHistoryService.WebGetGuildOwnerHistory(webUser.getUser(), guidId, pageable));
	}

  @GetMapping("/check-played/{game_theme_id}")
  public ResponseEntity<CheckPlayResponseDto> checkPlayTheme(
      @PathVariable("game_theme_id") UUID gameThemeId) {
    WebUser currentWebUser = AuthenticationUtil.getCurrentWebUser();
    if (currentWebUser == null) {
      return ResponseEntity.ok().body(CheckPlayResponseDto.from(false));
    }
    return ResponseEntity.ok()
        .body(webGameHistoryService.checkHasPlayed(gameThemeId, currentWebUser));
		}

	@PostMapping("/record/crimescene/{game_theme_id}")
	public ResponseEntity<WebHistoryResponseDto> requestCrimeScene (@PathVariable("game_theme_id") UUID gameThemeId, @RequestBody
	WebHistoryRequestDto dto){
			User currentUser = AuthenticationUtil.getCurrentUser();
			return ResponseEntity.ok().body(webGameHistoryService.WebHistoryAddRequest(currentUser,gameThemeId, dto));
		}
}
