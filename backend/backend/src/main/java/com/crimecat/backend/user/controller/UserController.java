package com.crimecat.backend.user.controller;

import com.crimecat.backend.user.dto.UserInfoRequestDto;
import com.crimecat.backend.user.dto.UserInfoResponseDto;
import com.crimecat.backend.user.dto.UserPermissionRequestDto;
import com.crimecat.backend.user.dto.UserPermissionResponseDto;
import com.crimecat.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
		return userService.registerUserInfo(
				userInfoRequestDto.getUserSnowflake(),
				userInfoRequestDto.getName(),
				userInfoRequestDto.getAvatar());
	}

	/**
	 * 유저가 특정 권한을 구매
	 * @param userSnowflake
	 * @param permissionName
	 */
	@PostMapping("/{user_snowflake}/permission")
	public UserPermissionResponseDto purchaseUserPermission(@PathVariable("user_snowflake") String userSnowflake, @RequestBody
			UserPermissionRequestDto userPermissionRequestDto) {
		return userService.purchaseUserPermission(userSnowflake, userPermissionRequestDto.getPermissionName());
	}
}
