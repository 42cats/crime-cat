package com.crimecat.backend.user.controller;

import com.crimecat.backend.user.dto.TotalUserRankingResponseDto;
import com.crimecat.backend.user.dto.UserGrantedPermissionResponseDto;
import com.crimecat.backend.user.dto.UserHasPermissionResponseDto;
import com.crimecat.backend.user.dto.UserInfoRequestDto;
import com.crimecat.backend.user.dto.UserInfoResponseDto;
import com.crimecat.backend.user.dto.UserPermissionPurchaseRequestDto;
import com.crimecat.backend.user.dto.UserPermissionPurchaseResponseDto;
import com.crimecat.backend.user.dto.UserRankingResponseDto;
import com.crimecat.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("v1/bot/users")
public class UserController {

	private final UserService userService;

	/**
	 * 유저 정보 저장
	 * @param userInfoRequestDto
	 * @return
	 */
	@PostMapping("")
	public UserInfoResponseDto saveUserInfo(@RequestBody UserInfoRequestDto userInfoRequestDto) {
		return userService.saveUserInfo(
				userInfoRequestDto.getUserSnowflake(),
				userInfoRequestDto.getName(),
				userInfoRequestDto.getAvatar());
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
		return userService.getTotalUserRankingByParamCondition(pageable, sortingCondition);
	}
}
