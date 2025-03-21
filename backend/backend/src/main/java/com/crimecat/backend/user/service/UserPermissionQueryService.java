package com.crimecat.backend.user.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.repository.UserPermissionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserPermissionQueryService {

	private final UserPermissionRepository userPermissionRepository;

	public Optional<UserPermission> findUserPermissionByPermissionId(User user, Permission permission) {
		return userPermissionRepository.findUserPermissionByPermissionName(user.getSnowflake(),
				permission);
	}

	public void purchasePermission(User user, Permission permission) {
		userPermissionRepository.save(new UserPermission(user, permission));
	}

	public List<UserPermission> getActiveUserPermissions(User user) {
		return userPermissionRepository.getActiveUserPermissions(user.getSnowflake(), LocalDateTime.now());
	}
}
