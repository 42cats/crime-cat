package com.crimecat.backend.user.controller;

import com.crimecat.backend.user.dto.SaveUserInfoDto;
import com.crimecat.backend.user.dto.UserInfoResponseDto;
import com.crimecat.backend.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("v1/bot/users")
public class UserController {

	private final UserService userService;

	@PostMapping("")
	public UserInfoResponseDto saveUserInfo(@RequestBody SaveUserInfoDto saveUserInfoDto) {
		return userService.registerUserInfo(
				saveUserInfoDto.getUserSnowflake(),
				saveUserInfoDto.getName(),
				saveUserInfoDto.getAvatar());
	}
}
