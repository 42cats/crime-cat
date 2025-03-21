package com.crimecat.backend.user.service;

import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.dto.UserInfoResponseDto;
import com.crimecat.backend.user.dto.UserPermissionResponseDto;
import com.crimecat.backend.user.dto.UserResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserQueryService userQueryService;

	@Transactional
	public UserInfoResponseDto registerUserInfo(String userSnowflake, String userName, String userAvatar) {
		String message = "Already User registered";
		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			user = userQueryService.save(User.of(userSnowflake, userName, userAvatar));
			message = "User registered";
		}

		UserResponseDto userResponseDto
				= new UserResponseDto(userSnowflake, userName, userAvatar, user.getCreatedAt());
		return new UserInfoResponseDto(message, userResponseDto);
	}

	@Transactional(readOnly = true)
	public User findUser(String userSnowflake) {
		return userQueryService.findByUserSnowflake(userSnowflake);
	}

	@Transactional
	public User saveUser(String userSnowflake, String userName, String userAvatar) {
		return userQueryService.save(User.of(userSnowflake, userName, userAvatar));
	}
}
