package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;

	public void usePoint(User user, Permission permission, Integer permissionPrice) {
		pointHistoryQueryService.BuyPermission(user, permission, permissionPrice);
	}
}
