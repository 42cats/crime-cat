package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.point.domain.PointHistory;
import com.crimecat.backend.bot.point.repository.PointHistoryRepository;
import com.crimecat.backend.bot.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryQueryService {

	private final PointHistoryRepository pointHistoryRepository;

	public void usePoint(User user, Permission permission, Integer permissionPrice) {
		pointHistoryRepository.save(new PointHistory(user, permission, permissionPrice));
	}
}
