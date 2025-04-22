package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.user.domain.DiscordUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;

	public void usePoint(DiscordUser user, Permission permission, Integer permissionPrice) {
		pointHistoryQueryService.usePoint(user, permission, permissionPrice);
	}
}
