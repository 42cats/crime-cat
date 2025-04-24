package com.crimecat.backend.bot.point.service;

import com.crimecat.backend.bot.coupon.domain.Coupon;
import com.crimecat.backend.bot.permission.domain.Permission;
import com.crimecat.backend.bot.point.domain.ItemType;
import com.crimecat.backend.bot.point.domain.PointHistory;
import com.crimecat.backend.bot.point.domain.TransactionType;
import com.crimecat.backend.bot.point.repository.PointHistoryRepository;
import com.crimecat.backend.bot.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryQueryService {

	private final PointHistoryRepository pointHistoryRepository;

	public void logPermissionPurchase(User user, TransactionType type, Permission permission) {
		PointHistory history = PointHistory.builder()
				.user(user)
				.type(type)
				.amount(permission.getPrice())
				.balanceAfter(user.getPoint())
				.itemType(ItemType.PERMISSION)
				.permission(permission)
				.memo("권한 구매: " + permission.getName())
				.build();

		pointHistoryRepository.save(history);
	}

	public void logPointTransaction(User user, TransactionType type, int amount, String memo) {
		PointHistory history = PointHistory.builder()
				.user(user)
				.type(type)
				.amount(amount)
				.balanceAfter(user.getPoint())
				.memo(memo)
				.build();

		pointHistoryRepository.save(history);
	}

	public void logGiftTransaction(User fromUser, User toUser, int amount) {
		PointHistory senderHistory = PointHistory.builder()
				.user(fromUser)
				.type(TransactionType.GIFT)
				.amount(amount)
				.balanceAfter(fromUser.getPoint())
				.relatedUserId(toUser)
				.memo("→ " + toUser.getWebUser().getNickname() + "에게 선물")
				.build();

		PointHistory receiverHistory = PointHistory.builder()
				.user(toUser)
				.type(TransactionType.RECEIVE)
				.amount(amount)
				.balanceAfter(toUser.getPoint())
				.relatedUserId(fromUser)
				.memo("← " + fromUser.getWebUser().getNickname() + "에게 받음")
				.build();

		pointHistoryRepository.save(senderHistory);
		pointHistoryRepository.save(receiverHistory);
	}

	public void logCouponTransaction(User user, Coupon coupon) {
		PointHistory couponHistory = PointHistory.builder()
				.user(user)
				.type(TransactionType.COUPON)
				.amount(coupon.getPoint())
				.balanceAfter(user.getPoint())
				.memo("쿠폰 등록으로 "+ coupon.getPoint() + "포인트 충전됨")
				.build();
		pointHistoryRepository.save(couponHistory);
	}
}

