package com.crimecat.backend.user.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserPermissionService {

	private final UserPermissionQueryService userPermissionQueryService;

	public UserPermission getUserPermissionByPermissionIdInActive(User user,
			Permission permission) {
		return userPermissionQueryService.findUserPermissionByPermissionIdInActive(user, permission).orElse(null);
	}

	public void purchasePermission(User user, Permission permission) {
		userPermissionQueryService.purchasePermission(user, permission);
	}

	public List<UserPermission> getActiveUserPermissions(User user) {
		return userPermissionQueryService.getActiveUserPermissions(user);
	}
}
