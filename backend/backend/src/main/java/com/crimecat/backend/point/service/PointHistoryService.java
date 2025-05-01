package com.crimecat.backend.point.service;

import com.crimecat.backend.coupon.domain.Coupon;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.user.domain.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;

	@Transactional
	public void buyPermission(User user, Permission permission) {
		user.subtractPoint(permission.getPrice());
		pointHistoryQueryService.logPermissionPurchase(user, TransactionType.USE, permission);
	}

	@Transactional
	public void chargePoint(User user, int amount) {
		user.addPoint(amount);
		pointHistoryQueryService.logPointTransaction(user, TransactionType.CHARGE, amount, "포인트 충전");
	}

	@Transactional
	public void dailyCheckPoint(User user, int amount) {
		user.addPoint(amount);
		pointHistoryQueryService.logPointTransaction(user, TransactionType.CHARGE, amount, "출석 체크");
	}
	@Transactional
	public void gift(User from, User to, int amount) {
		from.subtractPoint(amount);
		to.addPoint(amount);
		pointHistoryQueryService.logGiftTransaction(from,to,amount);

	}
	@Transactional
	public void redeemCoupon(User user, Coupon coupon){
		user.addPoint(coupon.getPoint());
		pointHistoryQueryService.logCouponTransaction(user,coupon);
	}
}

