package com.crimecat.backend.user.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserPermissionService {

	private final UserPermissionQueryService userPermissionQueryService;

	public UserPermission getUserPermissionByPermissionId(User user,
			UUID permissionId) {
		return userPermissionQueryService.findUserPermissionByPermissionId(user, permissionId).orElse(null);
	}

	public void purchasePermission(User user, Permission permission) {
		userPermissionQueryService.purchasePermission(user, permission);
	}

	public List<UserPermission> getActiveUserPermissions(User user) {
		return userPermissionQueryService.getActiveUserPermissions(user);
	}
}
