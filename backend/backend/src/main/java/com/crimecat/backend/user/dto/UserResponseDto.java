package com.crimecat.backend.user.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponseDto {

	private String userSnowflake;
	private String name;
	private String avatar;
	private LocalDateTime createdAt;
}
