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

        // WebUser가 null인 경우 DiscordUser 정보 사용
        if (user.getWebUser() != null) {
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
        } else {
            // DiscordUser 정보로 fallback
            return UserPointSummaryResponse.builder()
                    .userId(user.getDiscordUser().getId())
                    .nickname(user.getDiscordUser().getName())
                    .email(null) // DiscordUser에는 email 필드가 없음
                    .profileImagePath(user.getDiscordUser().getAvatar())
                    .currentBalance(user.getPoint())
                    .totalEarned(totalEarned)
                    .totalSpent(totalSpent)
                    .totalReceived(totalReceived)
                    .totalGifted(totalGifted)
                    .lastTransactionAt(lastTransaction != null ? lastTransaction.getUsedAt() : null)
                    .accountCreatedAt(user.getDiscordUser().getCreatedAt())
                    .build();
        }
    }

    /**
     * User 객체로부터 직접 포인트 요약 정보 생성
     */
    private UserPointSummaryResponse getUserPointSummaryFromUser(User user) {
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

        // WebUser가 null인 경우 DiscordUser 정보 사용
        if (user.getWebUser() != null) {
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
        } else {
            // DiscordUser 정보로 fallback
            return UserPointSummaryResponse.builder()
                    .userId(user.getDiscordUser().getId())
                    .nickname(user.getDiscordUser().getName())
                    .email(null) // DiscordUser에는 email 필드가 없음
                    .profileImagePath(user.getDiscordUser().getAvatar())
                    .currentBalance(user.getPoint())
                    .totalEarned(totalEarned)
                    .totalSpent(totalSpent)
                    .totalReceived(totalReceived)
                    .totalGifted(totalGifted)
                    .lastTransactionAt(lastTransaction != null ? lastTransaction.getUsedAt() : null)
                    .accountCreatedAt(user.getDiscordUser().getCreatedAt())
                    .build();
        }
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
                .map(this::getUserPointSummaryFromUser)
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
        // 사용자 정보 (WebUser 우선, null이면 DiscordUser 사용)
        String userNickname = pointHistory.getUser().getWebUser() != null ?
                pointHistory.getUser().getWebUser().getNickname() :
                pointHistory.getUser().getDiscordUser().getName();
        
        UUID userId = pointHistory.getUser().getWebUser() != null ?
                pointHistory.getUser().getWebUser().getId() :
                pointHistory.getUser().getDiscordUser().getId();
        
        // 연관 사용자 정보 (있는 경우)
        String relatedNickname = null;
        if (pointHistory.getRelatedUserId() != null) {
            relatedNickname = pointHistory.getRelatedUserId().getWebUser() != null ?
                    pointHistory.getRelatedUserId().getWebUser().getNickname() :
                    pointHistory.getRelatedUserId().getDiscordUser().getName();
        }
        
        return PointHistoryResponseDto.builder()
                .id(pointHistory.getId())
                .type(pointHistory.getType())
                .amount(pointHistory.getAmount())
                .balanceAfter(pointHistory.getBalanceAfter())
                .itemType(pointHistory.getItemType())
                .permissionName(pointHistory.getPermission() != null ? 
                        pointHistory.getPermission().getName() : null)
                .relatedNickname(relatedNickname)
                .memo(pointHistory.getMemo())
                .usedAt(pointHistory.getUsedAt())
                .userNickname(userNickname)
                .userId(userId)
                .build();
    }

    private List<SuspiciousActivityResponse> detectRapidEarning(LocalDateTime since) {
        List<Object[]> results = pointHistoryRepository.findRapidEarningUsers(since);
        Map<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> builderMap = new HashMap<>();
        Map<String, List<SuspiciousActivityResponse.TransactionDetail>> transactionMap = new HashMap<>();

        for (Object[] row : results) {
            String userId = row[0].toString();
            
            // 사용자별 빌더 생성 (처음 한 번만)
            if (!builderMap.containsKey(userId)) {
                builderMap.put(userId, SuspiciousActivityResponse.builder()
                        .userId(UUID.fromString(userId))
                        .userNickname((String) row[1])
                        .userEmail((String) row[2])
                        .suspiciousType("RAPID_EARNING")
                        .transactionCount(((Number) row[3]).intValue())
                        .totalAmount(((Number) row[4]).intValue())
                        .detectedAt(LocalDateTime.now())
                        .description(String.format("1시간 내 %d회 포인트 획득 (총 %,d포인트)",
                                ((Number) row[3]).intValue(),
                                ((Number) row[4]).intValue()))
                );
                transactionMap.put(userId, new ArrayList<>());
            }
            
            // 거래 내역 추가
            if (row[7] != null) {  // transaction_id가 있으면
                transactionMap.get(userId).add(
                        SuspiciousActivityResponse.TransactionDetail.builder()
                                .transactionId(UUID.fromString(row[7].toString()))
                                .type(TransactionType.valueOf((String) row[8]))
                                .amount(((Number) row[9]).intValue())
                                .usedAt(((java.sql.Timestamp) row[10]).toLocalDateTime())
                                .memo((String) row[11])
                                .relatedUserNickname((String) row[12])
                                .build()
                );
            }
        }

        // 빌더에서 최종 객체 생성
        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        for (Map.Entry<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> entry : builderMap.entrySet()) {
            String userId = entry.getKey();
            activities.add(entry.getValue()
                    .recentTransactions(transactionMap.get(userId))
                    .build());
        }

        return activities;
    }

    private List<SuspiciousActivityResponse> detectLargeAmountEarning(LocalDateTime since) {
        List<Object[]> results = pointHistoryRepository.findLargeAmountEarningUsers(since.minusHours(24));
        Map<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> builderMap = new HashMap<>();
        Map<String, List<SuspiciousActivityResponse.TransactionDetail>> transactionMap = new HashMap<>();

        for (Object[] row : results) {
            String userId = row[0].toString();
            
            if (!builderMap.containsKey(userId)) {
                builderMap.put(userId, SuspiciousActivityResponse.builder()
                        .userId(UUID.fromString(userId))
                        .userNickname((String) row[1])
                        .userEmail((String) row[2])
                        .suspiciousType("LARGE_AMOUNT")
                        .transactionCount(((Number) row[3]).intValue())
                        .totalAmount(((Number) row[4]).intValue())
                        .detectedAt(LocalDateTime.now())
                        .description(String.format("24시간 내 %,d포인트 획득 (%d건의 거래)",
                                ((Number) row[4]).intValue(),
                                ((Number) row[3]).intValue()))
                );
                transactionMap.put(userId, new ArrayList<>());
            }
            
            if (row[5] != null && transactionMap.get(userId).size() < 10) {  // 최근 10건만
                transactionMap.get(userId).add(
                        SuspiciousActivityResponse.TransactionDetail.builder()
                                .transactionId(UUID.fromString(row[5].toString()))
                                .type(TransactionType.valueOf((String) row[6]))
                                .amount(((Number) row[7]).intValue())
                                .usedAt(((java.sql.Timestamp) row[8]).toLocalDateTime())
                                .memo((String) row[9])
                                .relatedUserNickname((String) row[10])
                                .build()
                );
            }
        }

        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        for (Map.Entry<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> entry : builderMap.entrySet()) {
            String userId = entry.getKey();
            activities.add(entry.getValue()
                    .recentTransactions(transactionMap.get(userId))
                    .build());
        }

        return activities;
    }

    private List<SuspiciousActivityResponse> detectRepeatedTransfers(LocalDateTime since) {
        List<Object[]> results = pointHistoryRepository.findRepeatedTransferUsers(since);
        Map<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> builderMap = new HashMap<>();
        Map<String, List<SuspiciousActivityResponse.TransactionDetail>> transactionMap = new HashMap<>();

        for (Object[] row : results) {
            String userId = row[0].toString();
            String relatedNickname = (String) row[10];
            
            if (!builderMap.containsKey(userId)) {
                builderMap.put(userId, SuspiciousActivityResponse.builder()
                        .userId(UUID.fromString(userId))
                        .userNickname((String) row[1])
                        .userEmail((String) row[2])
                        .suspiciousType("REPEATED_TRANSFER")
                        .transactionCount(((Number) row[3]).intValue())
                        .totalAmount(((Number) row[4]).intValue())
                        .detectedAt(LocalDateTime.now())
                        .description(String.format("%s님과 %d회 반복 거래 (총 %,d포인트)",
                                relatedNickname,
                                ((Number) row[3]).intValue(),
                                ((Number) row[4]).intValue()))
                );
                transactionMap.put(userId, new ArrayList<>());
            }
            
            if (row[5] != null) {
                transactionMap.get(userId).add(
                        SuspiciousActivityResponse.TransactionDetail.builder()
                                .transactionId(UUID.fromString(row[5].toString()))
                                .type(TransactionType.valueOf((String) row[6]))
                                .amount(((Number) row[7]).intValue())
                                .usedAt(((java.sql.Timestamp) row[8]).toLocalDateTime())
                                .memo((String) row[9])
                                .relatedUserNickname(relatedNickname)
                                .build()
                );
            }
        }

        List<SuspiciousActivityResponse> activities = new ArrayList<>();
        for (Map.Entry<String, SuspiciousActivityResponse.SuspiciousActivityResponseBuilder> entry : builderMap.entrySet()) {
            String userId = entry.getKey();
            activities.add(entry.getValue()
                    .recentTransactions(transactionMap.get(userId))
                    .build());
        }

        return activities;
    }
}
