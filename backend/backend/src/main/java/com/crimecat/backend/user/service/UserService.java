package com.crimecat.backend.user.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.permission.service.PermissionService;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.domain.UserPermission;
import com.crimecat.backend.user.dto.UserHasPermissionResponseDto;
import com.crimecat.backend.user.dto.UserInfoResponseDto;
import com.crimecat.backend.user.dto.UserPermissionDto;
import com.crimecat.backend.user.dto.UserPermissionResponseDto;
import com.crimecat.backend.user.dto.UserResponseDto;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserQueryService userQueryService;
	private final PointHistoryService pointHistoryService;
	private final PermissionService permissionService;
	private final UserPermissionService userPermissionService;

	@Transactional
	public UserInfoResponseDto registerUserInfo(String userSnowflake, String userName, String userAvatar) {
		String message = "Already User registered";
		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			user = userQueryService.save(User.of(userSnowflake, userName, userAvatar));
			message = "User registered";
		}

		UserResponseDto userResponseDto
				= new UserResponseDto(userSnowflake, userName, userAvatar, user.getCreatedAt());
		return new UserInfoResponseDto(message, userResponseDto);
	}

	/**
	 * 특정 유저가 특정 권한 구매
	 * @param userSnowflake
	 * @param permissionName
	 * @return
	 */
		/*
			유저 확인
			포인트 확인
			권한 확인
			구매 -> 포인트 차감 및 포인트 히스토리 생성
			권한 있는 지 확인 후 연장 및 추가
			저장
		 */
	@Transactional
	public UserPermissionResponseDto purchaseUserPermission(String userSnowflake,
			String permissionName) {

		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			return new UserPermissionResponseDto("user not found", null);
		}

		Permission permission = permissionService.findPermissionByPermissionName(permissionName);
		if (permission == null) {
			return new UserPermissionResponseDto("permission not found", null);
		}

		Integer userPoint = user.getPoint();
		Integer permissionPrice = permission.getPrice();
		if (userPoint < permissionPrice) {
			return null;
			// TODO : 에러 반환 확인
//			return new UserPermissionResponseDto("point not enough", );
		}

		user.usePoints(permissionPrice);
		pointHistoryService.usePoint(user, permission, permissionPrice);

		UserPermission userPermission = userPermissionService.getUserPermissionByPermissionId(user, permission);
		if (userPermission != null && LocalDateTime.now().isBefore(userPermission.getExpiredAt())) {
			userPermission.extendPermissionPeriod(permission.getDuration());
		}
		else {
			userPermissionService.purchasePermission(user, permission);
		}

		List<UserPermissionDto> userPermissionDtos = userPermissionService.getActiveUserPermissions(user)
				.stream()
				.map(up -> new UserPermissionDto(up.getUser().getName(), up.getExpiredAt()))
				.toList();

		return new UserPermissionResponseDto("Permission granted successfully", userPermissionDtos);
	}

	public UserHasPermissionResponseDto checkUserHasPermissionByPermissionName(String userSnowflake,
			String permissionName) {
		User user = userQueryService.findByUserSnowflake(userSnowflake);
		if (user == null) {
			return new UserHasPermissionResponseDto("user not found");
		}

		Permission permission = permissionService.findPermissionByPermissionName(permissionName);
		if (permission == null) {
			return new UserHasPermissionResponseDto("permission not found");
		}

		if (userPermissionService.getUserPermissionByPermissionId(user, permission) != null) {
			return new UserHasPermissionResponseDto("Permission has");
		}
		return new UserHasPermissionResponseDto("not has Permission");
	}
}
