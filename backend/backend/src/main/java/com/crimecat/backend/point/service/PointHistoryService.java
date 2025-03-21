package com.crimecat.backend.point.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;

	public void usePoint(User user, Permission permission, Integer permissionPrice) {
		pointHistoryQueryService.usePoint(user, permission, permissionPrice);
	}
}
