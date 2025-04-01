package com.crimecat.backend.point.service;

import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.repository.PointHistoryRepository;
import com.crimecat.backend.user.domain.User;
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
