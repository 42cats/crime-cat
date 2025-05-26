package com.crimecat.backend.user.dto;

import java.time.LocalDateTime;

import com.crimecat.backend.user.domain.UserPermission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
public class UserGrantedPermissionDto {

	private String permissionId;
	private String permissionName;
	private LocalDateTime expiredDate;
	private String info;

	public static UserGrantedPermissionDto of(UserPermission userPermission) {
	return UserGrantedPermissionDto.builder()
	.permissionId(userPermission.getId().toString())
	.permissionName(userPermission.getPermission().getName())
	.expiredDate(userPermission.getExpiredAt())
	.info(userPermission.getPermission().getInfo())
	.build();
	}
}
