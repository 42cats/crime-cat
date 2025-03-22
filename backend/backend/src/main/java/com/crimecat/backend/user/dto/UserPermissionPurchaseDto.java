package com.crimecat.backend.user.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPermissionPurchaseDto {

	private String name;
	private LocalDateTime duration;
}
