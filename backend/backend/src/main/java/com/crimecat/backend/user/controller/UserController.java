package com.crimecat.backend.user.controller;

import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.user.dto.*;
import com.crimecat.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/bot/users")
public class UserController {

	private final UserService userService;

	/**
	 * 유저 정보 저장
	 * @param userInfoRequestDto
	 * @return
	 */
	@PostMapping("")
	public UserInfoResponseDto saveUserInfo(@RequestBody UserInfoRequestDto userInfoRequestDto) {
		log.info("save user {}", userInfoRequestDto.toString());
		return userService.saveUserInfo(
				userInfoRequestDto.getUserSnowflake(),
				userInfoRequestDto.getName(),
				userInfoRequestDto.getAvatar());
	}

	/**
	 * 유저 정보 반환
	 * @param userSnowflake
	 * @return
	 */
	@GetMapping("/{user_snowflake}")
	public UserDbInfoResponseDto getUserInfo(@PathVariable("user_snowflake") String userSnowflake) {
		return userService.getUserDbInfo(userSnowflake);
	}

	/**
	 * 유저가 특정 권한을 구매
	 * @param userSnowflake
	 * @param userPermissionPurchaseRequestDto
	 */
	@PostMapping("/{user_snowflake}/permission")
	public UserPermissionPurchaseResponseDto purchaseUserPermission(@PathVariable("user_snowflake") String userSnowflake, @RequestBody
	UserPermissionPurchaseRequestDto userPermissionPurchaseRequestDto) {
		return userService.purchaseUserPermission(userSnowflake, userPermissionPurchaseRequestDto.getPermissionName());
	}

	/**
	 * 조건에 맞는 유저 snowflake 목록 반환
	 * @param guildSnowflake 유저가 플레이한 길드 snowflake
	 * @param discordAlarm discord alarm 설정
	 */
	@GetMapping
	public MessageDto<UserListResponseDto> getUserList(@RequestParam(value = "guildSnowflake", required = false) String guildSnowflake,
														 @RequestParam(value = "discordAlarm", required = false) Boolean discordAlarm) {
		return new MessageDto<>("User List founded", userService.getUserList(guildSnowflake, discordAlarm));
	}

	/**
	 * 유저 정보 수정
	 * @param userSnowflake 수정할 유저 discord snowflake
	 * @param userPatchRequestDto 유저 설정
	 * @return
	 */
	@PatchMapping("/{user_snowflake}")
	public MessageDto<?> updateUserInfo(@PathVariable("user_snowflake") String userSnowflake,
										@RequestBody UserPatchRequestDto userPatchRequestDto) {
		return new MessageDto<>("User updated",
				userService.updateUserInfo(userSnowflake, userPatchRequestDto.getAvatar(), userPatchRequestDto.getDiscordAlarm()));
	}

	/**
	 * 유저에게 특정 권한이 있는지 확인
	 * @param userSnowflake
	 * @param permissionName
	 * @return
	 */
	@GetMapping("/{user_snowflake}/permission")
	public UserHasPermissionResponseDto hasPermission(@PathVariable("user_snowflake") String userSnowflake, @RequestParam("permission_name") String permissionName) {
		return userService.checkUserHasPermissionByPermissionName(userSnowflake, permissionName);
	}

	/**
	 * 유저가 가진 모든 권한 조회
	 * @param userSnowflake
	 * @return
	 */
	@GetMapping("/{user_snowflake}/permissions")
	public UserGrantedPermissionResponseDto getAllUserPermissions(
			@PathVariable("user_snowflake") String userSnowflake) {
		return userService.getAllUserPermissions(userSnowflake);
	}


	/**
	 * 유저의 플레이 횟수, 보유 포인트 별 현재 랭킹을 반환
	 * @param userSnowflake
	 * @return
	 */
	@GetMapping("/{user_snowflake}/rank")
	public UserRankingResponseDto getUserRanking(
			@PathVariable("user_snowflake") String userSnowflake) {
		return userService.getUserRanking(userSnowflake);
	}


	/**
	 * 전체 유저의 target 조건에 따른 순위를 반환
	 * @param sortingCondition
	 * @param size
	 * @param page
	 * @return
	 */
	@GetMapping("/ranks")
	public TotalUserRankingResponseDto getTotalUserRankingByParamCondition(
			@RequestParam("target") String sortingCondition,
			@RequestParam(value = "limit", defaultValue = "10") int size,
			@RequestParam(value = "page", defaultValue = "0") int page) {
		Pageable pageable = PageRequest.of(page, size);
		System.out.println(sortingCondition + size + page);
		return userService.getTotalUserRankingByParamCondition(pageable, sortingCondition);
	}


}
