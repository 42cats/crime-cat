package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.coupon.domain.Coupon;
import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.point.domain.TransactionType;
import com.crimecat.backend.bot.user.domain.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;

	@Transactional
	public void buyPermission(User user, Permission permission) {
		pointHistoryQueryService.logPermissionPurchase(user, TransactionType.USE, permission);
	}

	@Transactional
	public void chargePoint(User user, int amount) {
		user.addPoint(amount);
		pointHistoryQueryService.logPointTransaction(user, TransactionType.CHARGE, amount, "포인트 충전");
	}

	@Transactional
	public void gift(User from, User to, int amount) {
		from.subtractPoint(amount);
		to.addPoint(amount);

	}
	@Transactional
	public void redeemCoupon(User user, Coupon coupon){
		pointHistoryQueryService.logCouponTransaction(user,coupon);
	}
}

