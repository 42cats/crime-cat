package com.crimecat.backend.bot.user.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.UserPermission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@AllArgsConstructor
@Getter
@Builder
public class UserGrantedPermissionDto {

	private UUID permissionId;
	private String permissionName;
	private LocalDateTime expiredDate;
	private String info;

	public static UserGrantedPermissionDto of(UserPermission userPermission) {
		return UserGrantedPermissionDto.builder()
				.permissionId(userPermission.getId())
				.permissionName(userPermission.getPermission().getName())
				.expiredDate(userPermission.getExpiredAt())
				.info(userPermission.getPermission().getInfo())
				.build();
	}
}
