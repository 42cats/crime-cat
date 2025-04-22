package com.crimecat.backend.bot.user.service;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import com.crimecat.backend.bot.user.domain.UserPermission;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserPermissionService {

	private final UserPermissionQueryService userPermissionQueryService;

	public UserPermission getUserPermissionByPermissionId(DiscordUser user,
														  UUID permissionId) {
		return userPermissionQueryService.findUserPermissionByPermissionId(user, permissionId).orElse(null);
	}

	public void purchasePermission(DiscordUser user, Permission permission) {
		userPermissionQueryService.purchasePermission(user, permission);
	}

	public List<UserPermission> getActiveUserPermissions(DiscordUser user) {
		return userPermissionQueryService.getActiveUserPermissions(user);
	}
}
