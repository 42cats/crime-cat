package com.crimecat.backend.user.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.DiscordUser;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.repository.UserPermissionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPermissionQueryService {

	private final UserPermissionRepository userPermissionRepository;

	@Transactional(readOnly = true)
	public Optional<UserPermission> findUserPermissionByPermissionId(DiscordUser user, UUID permissionId) {
		return userPermissionRepository.findUserPermissionByPermissionId(user.getSnowflake(),
				permissionId);
	}

	@Transactional
	public void purchasePermission(DiscordUser user, Permission permission) {
		userPermissionRepository.save(new UserPermission(user, permission));
	}

	@Transactional(readOnly = true)
	public List<UserPermission> getActiveUserPermissions(DiscordUser user) {
		return userPermissionRepository.getActiveUserPermissions(user.getSnowflake(), LocalDateTime.now());
	}

	/**
	 * 권한 연장
	 * @param userPermission 연장할 사용자 권한
	 * @param newExpiredDate 새로운 만료일
	 */
	@Transactional
	public void extendPermission(UserPermission userPermission, LocalDateTime newExpiredDate) {
		userPermission.setExpiredAt(newExpiredDate);
		userPermissionRepository.save(userPermission);
	}
}
