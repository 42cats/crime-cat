package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.point.domain.ItemType;
import com.crimecat.backend.bot.point.domain.PointHistory;
import com.crimecat.backend.bot.point.domain.TransactionType;
import com.crimecat.backend.bot.point.repository.PointHistoryRepository;
import com.crimecat.backend.bot.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PointHistoryQueryService {

	private final PointHistoryRepository pointHistoryRepository;

	@Transactional
	public void BuyPermission(User user, Permission permission, Integer permissionPrice, Integer afterBalance) {
		PointHistory history = PointHistory.builder()
				.user(user)
				.type(TransactionType.USE)
				.amount(permissionPrice)
				.itemType(ItemType.PERMISSION)
				.itemId(permission.getId())
				.balanceAfter(afterBalance)
				.memo(permission.getName() + "권한 구입" + permissionPrice + "포인트, 구입후 잔액" + afterBalance)
				.build();
		pointHistoryRepository.save(history);
	}
}
