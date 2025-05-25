package com.crimecat.backend.admin.service;

import com.crimecat.backend.admin.dto.PointHistoryFilterRequest;
import com.crimecat.backend.admin.dto.PointHistoryStatisticsResponse;
import com.crimecat.backend.admin.dto.SuspiciousActivityResponse;
import com.crimecat.backend.admin.dto.UserPointSummaryResponse;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.point.domain.PointHistory;
import com.crimecat.backend.point.domain.TransactionType;
import com.crimecat.backend.point.dto.PointHistoryResponseDto;
import com.crimecat.backend.point.repository.PointHistoryRepository;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPointHistoryService {

    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

    /**
     * 전체 사용자의 포인트 내역을 필터링하여 조회
     */
    public Page<PointHistoryResponseDto> getAllPointHistory(PointHistoryFilterRequest filter, Pageable pageable) {
        Specification<PointHistory> spec = createSpecification(filter);
        Page<PointHistory> pointHistories = pointHistoryRepository.findAll(spec, pageable);
        return pointHistories.map(this::convertToResponseDto);
    }

    /**
     * 의심스러운 활동 감지
     */
    public List<SuspiciousActivityResponse> getSuspiciousActivities(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<SuspiciousActivityResponse> suspiciousActivities = new ArrayList<>();

        // 1. 짧은 시간 내 대량 포인트 획득 (1시간 내 5회 이상)
        suspiciousActivities.addAll(detectRapidEarning(since));

        // 2. 24시간 내 대량 포인트 획득 (10만 포인트 이상)
        suspiciousActivities.addAll(detectLargeAmountEarning(since));

        // 3. 동일 사용자 간 반복적인 거래
        suspiciousActivities.addAll(detectRepeatedTransfers(since));

        return suspiciousActivities;
    }

    /**
     * 특정 사용자의 포인트 내역 조회
     */
    public Page<PointHistoryResponseDto> getUserPointHistory(
            UUID userId, 
            TransactionType type, 
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable
    ) {
        User user = userRepository.findByWebUserId(userId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        Specification<PointHistory> spec = Specification.where(byUser(user));
        
        if (type != null) {
            spec = spec.and(byType(type));
        }
        if (startDate != null && endDate != null) {
            spec = spec.and(byDateRange(startDate, endDate));
        }

        Page<PointHistory> pointHistories = pointHistoryRepository.findAll(spec, pageable);
        return pointHistories.map(this::convertToResponseDto);
    }

    /**
     * 특정 사용자의 포인트 요약 정보
     */
    public UserPointSummaryResponse getUserPointSummary(UUID userId) {
        User user = userRepository.findByWebUserId(userId)
                .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);

        Integer totalEarned = pointHistoryRepository.sumAmountByUserAndTypes(
                user, List.of(TransactionType.CHARGE, TransactionType.DAILY, 
                        TransactionType.RECEIVE, TransactionType.COUPON, TransactionType.THEME_REWARD)
        ).orElse(0);

        Integer totalSpent = pointHistoryRepository.sumAmountByUserAndTypes(
                user, List.of(TransactionType.USE, TransactionType.GIFT)
        ).orElse(0);

        Integer totalReceived = pointHistoryRepository.sumAmountByUserAndTypes(
                user, List.of(TransactionType.RECEIVE)
        ).orElse(0);

        Integer totalGifted = pointHistoryRepository.sumAmountByUserAndTypes(
                user, List.of(TransactionType.GIFT)
        ).orElse(0);

        PointHistory lastTransaction = pointHistoryRepository
                .findByUserOrderByUsedAtDesc(user, PageRequest.of(0, 1))
                .getContent().stream().findFirst().orElse(null);

        return UserPointSummaryResponse.builder()
                .userId(user.getWebUser().getId())
                .nickname(user.getWebUser().getNickname())
                .email(user.getWebUser().getEmail())
                .profileImagePath(user.getWebUser().getProfileImagePath())
                .currentBalance(user.getPoint())
                .totalEarned(totalEarned)
                .totalSpent(totalSpent)
                .totalReceived(totalReceived)
                .totalGifted(totalGifted)
                .lastTransactionAt(lastTransaction != null ? lastTransaction.getUsedAt() : null)
                .accountCreatedAt(user.getWebUser().getCreatedAt())
                .build();
    }

    /**
     * 포인트 통계 조회
     */
    public PointHistoryStatisticsResponse getPointStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        Specification<PointHistory> spec = byDateRange(startDate, endDate);
        List<PointHistory> histories = pointHistoryRepository.findAll(spec);

        Map<TransactionType, Integer> transactionsByType = histories.stream()
                .collect(Collectors.groupingBy(
                        PointHistory::getType,
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        Map<TransactionType, Integer> amountByType = histories.stream()
                .collect(Collectors.groupingBy(
                        PointHistory::getType,
                        Collectors.summingInt(PointHistory::getAmount)
                ));

        Map<Integer, Integer> hourlyDistribution = histories.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getUsedAt().getHour(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        int totalPointsCirculated = histories.stream()
                .mapToInt(PointHistory::getAmount)
                .sum();

        Set<UUID> uniqueUsers = histories.stream()
                .map(h -> h.getUser().getId())
                .collect(Collectors.toSet());

        OptionalDouble avgAmount = histories.stream()
                .mapToInt(PointHistory::getAmount)
                .average();

        OptionalInt maxAmount = histories.stream()
                .mapToInt(PointHistory::getAmount)
                .max();

        OptionalInt minAmount = histories.stream()
                .mapToInt(PointHistory::getAmount)
                .min();

        return PointHistoryStatisticsResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalTransactions(histories.size())
                .totalPointsCirculated(totalPointsCirculated)
                .transactionsByType(transactionsByType)
                .amountByType(amountByType)
                .hourlyDistribution(hourlyDistribution)
                .uniqueUsers(uniqueUsers.size())
                .averageTransactionAmount(avgAmount.orElse(0.0))
                .maxTransactionAmount(maxAmount.orElse(0))
                .minTransactionAmount(minAmount.orElse(0))
                .build();
    }

    /**
     * 포인트 상위 보유자 조회
     */
    public List<UserPointSummaryResponse> getTopPointHolders(int limit) {
        List<User> topHolders = userRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "point"))
        ).getContent();

        return topHolders.stream()
                .map(user -> getUserPointSummary(user.getWebUser().getId()))
                .collect(Collectors.toList());
    }

    // Private helper methods

    private Specification<PointHistory> createSpecification(PointHistoryFilterRequest filter) {
        Specification<PointHistory> spec = Specification.where(null);

        if (filter.getType() != null) {
            spec = spec.and(byType(filter.getType()));
        }
        if (filter.getUserId() != null) {
            User user = userRepository.findByWebUserId(filter.getUserId())
                    .orElseThrow(ErrorStatus.USER_NOT_FOUND::asServiceException);
            spec = spec.and(byUser(user));
        }
        if (filter.getStartDate() != null && filter.getEndDate() != null) {
            spec = spec.and(byDateRange(filter.getStartDate(), filter.getEndDate()));
        }
        if (filter.getMinAmount() != null) {
            spec = spec.and(byMinAmount(filter.getMinAmount()));
        }
        if (filter.getMaxAmount() != null) {
            spec = spec.and(byMaxAmount(filter.getMaxAmount()));
        }

        return spec;
    }

    private Specification<PointHistory> byUser(User user) {
        return (root, query, criteriaBuilder) -> 
                criteriaBuilder.equal(root.get("user"), user);
    }

    private Specification<PointHistory> byType(TransactionType type) {
        return (root, query, criteriaBuilder) -> 
                criteriaBuilder.equal(root.get("type"), type);
    }

    private Specification<PointHistory> byDateRange(LocalDateTime start, LocalDateTime end) {
        return (root, query, criteriaBuilder) -> 
                criteriaBuilder.between(root.get("usedAt"), start, end);
    }

    private Specification<PointHistory> byMinAmount(Integer minAmount) {
        return (root, query, criteriaBuilder) -> 
                criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), minAmount);
    }

    private Specification<PointHistory> byMaxAmount(Integer maxAmount) {
        return (root, query, criteriaBuilder) -> 
                criteriaBuilder.lessThanOrEqualTo(root.get("amount"), maxAmount);
    }

    private PointHistoryResponseDto convertToResponseDto(PointHistory pointHistory) {
        return PointHistoryResponseDto.builder()
                .id(pointHistory.getId())
                .type(pointHistory.getType())
                .amount(pointHistory.getAmount())
                .balanceAfter(pointHistory.getBalanceAfter())
                .itemType(pointHistory.getItemType())
                .permissionName(pointHistory.getPermission() != null ? 
                        pointHistory.getPermission().getName() : null)
                .relatedNickname(pointHistory.getRelatedUserId() != null ? 
                        pointHistory.getRelatedUserId().getWebUser().getNickname() : null)
                .memo(pointHistory.getMemo())
                .usedAt(pointHistory.getUsedAt())
                .userNickname(pointHistory.getUser().getWebUser().getNickname())
                .userId(pointHistory.getUser().getWebUser().getId())
                .build();
    }

    private List<SuspiciousActivityResponse> detectRapidEarning(LocalDateTime since) {
        // 1시간 내 5회 이상 포인트 획득한 사용자 찾기
        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        
        // TODO: 실제 구현시 Native Query 또는 QueryDSL 사용 권장
        // 여기서는 간단한 로직으로 구현
        
        return activities;
    }

    private List<SuspiciousActivityResponse> detectLargeAmountEarning(LocalDateTime since) {
        // 24시간 내 10만 포인트 이상 획득한 사용자 찾기
        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        
        // TODO: 실제 구현시 Native Query 또는 QueryDSL 사용 권장
        
        return activities;
    }

    private List<SuspiciousActivityResponse> detectRepeatedTransfers(LocalDateTime since) {
        // 동일 사용자 간 반복적인 거래 찾기
        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        
        // TODO: 실제 구현시 Native Query 또는 QueryDSL 사용 권장
        
        return activities;
    }
}
