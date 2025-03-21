package com.crimecat.backend.user.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPermissionDto {

	private String name;
	private LocalDateTime duration;
}
