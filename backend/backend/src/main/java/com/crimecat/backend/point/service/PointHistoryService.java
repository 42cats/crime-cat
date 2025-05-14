package com.crimecat.backend.point.service;

import com.crimecat.backend.coupon.domain.Coupon;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.permission.domain.Permission;
import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.point.dto.PointHistorySummaryDto;
import com.crimecat.backend.point.repository.PointHistoryRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PointHistoryService {

	private final PointHistoryQueryService pointHistoryQueryService;
	private final PointHistoryRepository pointHistoryRepository;
	private final UserRepository userRepository;

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
		pointHistoryQueryService.logPointTransaction(user, TransactionType.DAILY, amount, "출석 체크");
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

	public Page<PointHistory> getUserPointHistory(String userId, TransactionType type, Pageable pageable) {
		User user = userRepository.findByWebUserId(UUID.fromString(userId))
				.orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

		if (type == null) {
			return pointHistoryRepository.findByUserOrderByUsedAtDesc(user, pageable);
		} else {
			return pointHistoryRepository.findByUserAndTypeOrderByUsedAtDesc(user, type, pageable);
		}
	}

	public PointHistorySummaryDto getPointHistorySummary(String userId) {
		User user = userRepository.findByWebUserId(UUID.fromString(userId))
				.orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

		Integer currentBalance = user.getPoint();
		Integer totalEarned = pointHistoryRepository.sumAmountByUserAndTypes(
				user, List.of(TransactionType.CHARGE, TransactionType.DAILY, TransactionType.RECEIVE, TransactionType.COUPON)
		).orElse(0);
		Integer totalSpent = pointHistoryRepository.sumAmountByUserAndTypes(
				user, List.of(TransactionType.USE)
		).orElse(0);
		Integer totalReceived = pointHistoryRepository.sumAmountByUserAndTypes(
				user, List.of(TransactionType.RECEIVE)
		).orElse(0);
		Integer totalGifted = pointHistoryRepository.sumAmountByUserAndTypes(
				user, List.of(TransactionType.GIFT)
		).orElse(0);

		return PointHistorySummaryDto.of(
				currentBalance,
				totalEarned,
				totalSpent,
				totalReceived,
				totalGifted
		);
	}
}

