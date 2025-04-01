package com.crimecat.backend.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserGrantedPermissionDto {

	private UUID permissionId;
	private String permissionName;
	private LocalDateTime expiredDate;
}
