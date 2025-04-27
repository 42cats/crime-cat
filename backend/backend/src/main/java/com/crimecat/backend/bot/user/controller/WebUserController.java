package com.crimecat.backend.bot.user.controller;

import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.user.domain.User;
import com.crimecat.backend.bot.user.dto.*;
import com.crimecat.backend.bot.user.repository.UserRepository;
import com.crimecat.backend.bot.user.service.UserService;
import com.crimecat.backend.exception.ErrorStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class WebUserController {

	private final UserService userService;
	private final UserRepository userRepository;

	/**
	 * 유저가 가진 모든 권한 조회
	 * @param userId
	 * @return
	 */
	@GetMapping("/{user_id}/permissions")
	public UserGrantedPermissionResponseDto getAllUserPermissions(
			@PathVariable("user_id") String userId) {
		User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(ErrorStatus.USER_NOT_FOUND::asControllerException);
		return userService.getAllUserPermissions(user.getDiscordSnowflake());
	}

}
