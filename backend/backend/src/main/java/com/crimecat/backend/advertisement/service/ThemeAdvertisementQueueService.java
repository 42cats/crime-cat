package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.dto.PublicThemeAdvertisementResponse;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import com.crimecat.backend.gametheme.service.GameThemeService;
import com.crimecat.backend.gametheme.dto.GetGameThemeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeAdvertisementQueueService {
    
    private static final int MAX_ACTIVE_ADS = 15;
    private static final int COST_PER_DAY = 100;
    private static final int MAX_DAYS_PER_AD = 15;
    
    private final ThemeAdvertisementRequestRepository requestRepository;
    private final PointHistoryService pointHistoryService;
    private final UserRepository userRepository;
    private final DiscordBotCacheService discordBotCacheService;
    private final ThemeAdvertisementNotificationService notificationService;
    private final ThemeAdvertisementValidationService validationService;
    private final RateLimitingService rateLimitingService;
    private final InputSanitizationService sanitizationService;
    private final GameThemeService gameThemeService;
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, key = "#userId"),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE + "_carousel", allEntries = true),
        // 새 광고 생성 시 통계 캐시도 무효화
        @CacheEvict(value = CacheType.THEME_AD_USER_STATS, key = "#userId"),
        @CacheEvict(value = CacheType.THEME_AD_USER_SUMMARY, key = "#userId"),
        @CacheEvict(value = CacheType.THEME_AD_PLATFORM_STATS, allEntries = true)
    })
    public ThemeAdvertisementRequest requestAdvertisement(UUID userId, UUID themeId, String themeName, 
                                                        ThemeAdvertisementRequest.ThemeType themeType, 
                                                        int requestedDays) {
        // 1. Rate limiting 검증
        rateLimitingService.checkRateLimit(userId);
        
        // 2. 입력 데이터 검증 및 정화
        sanitizationService.validateNumberRange(requestedDays, 1, MAX_DAYS_PER_AD, "광고 기간");
        String sanitizedThemeName = sanitizationService.sanitizeThemeName(themeName);
        
        // 3. 종합 검증 (테마 소유권, 중복 광고, 포인트 잔액)
        validationService.validateAdvertisementRequest(userId, themeId, requestedDays);
        
        // 4. 비용 계산
        int totalCost = requestedDays * COST_PER_DAY;
        
        // 5. 사용자 조회 및 포인트 차감
        User user = userRepository.findByWebUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        boolean deducted = pointHistoryService.usePointsForAdvertisement(user, totalCost, 
            "테마 광고 신청: " + sanitizedThemeName + " (" + requestedDays + "일)");
        if (!deducted) {
            throw new IllegalStateException("포인트가 부족합니다. 필요 포인트: " + totalCost);
        }
        
        try {
            // 5. 광고 신청 생성
            ThemeAdvertisementRequest request = ThemeAdvertisementRequest.builder()
                .userId(userId)
                .themeId(themeId)
                .themeName(sanitizedThemeName)
                .themeType(themeType)
                .requestedDays(requestedDays)
                .totalCost(totalCost)
                .build();
            
            // 6. 활성 광고 수 확인
            long activeCount = requestRepository.countByStatus(AdvertisementStatus.ACTIVE);
            
            if (activeCount < MAX_ACTIVE_ADS) {
                // 즉시 활성화
                request.setStatus(AdvertisementStatus.ACTIVE);
                request.setStartedAt(LocalDateTime.now());
                request.setExpiresAt(LocalDateTime.now().plusDays(requestedDays));
                request.setRemainingDays(requestedDays);
                log.info("광고 즉시 활성화: userId={}, themeId={}", userId, themeId);
            } else {
                // 대기열에 추가
                request.setStatus(AdvertisementStatus.PENDING_QUEUE);
                Optional<Integer> maxPosition = requestRepository.findMaxQueuePosition();
                request.setQueuePosition(maxPosition.orElse(0) + 1);
                log.info("광고 대기열 추가: userId={}, themeId={}, position={}", userId, themeId, request.getQueuePosition());
            }
            
            ThemeAdvertisementRequest savedRequest = requestRepository.save(request);
            
            // 활성 광고가 변경된 경우 디스코드 봇 캐시 업데이트
            if (savedRequest.getStatus() == AdvertisementStatus.ACTIVE) {
                discordBotCacheService.updateActiveAdvertisementsCache();
            }
            
            return savedRequest;
            
        } catch (Exception e) {
            // 오류 발생 시 포인트 환불
            pointHistoryService.refundAdvertisementPoints(user, totalCost, "광고 신청 실패로 인한 환불");
            throw new RuntimeException("광고 신청 중 오류가 발생했습니다.", e);
        }
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, key = "#request.userId"),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE + "_carousel", allEntries = true)
    })
    public void cancelQueuedAdvertisement(UUID requestId) {
        ThemeAdvertisementRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("광고 신청을 찾을 수 없습니다."));
        
        if (request.getStatus() != AdvertisementStatus.PENDING_QUEUE) {
            throw new IllegalStateException("대기 중인 광고만 취소할 수 있습니다.");
        }
        
        // 사용자 조회 및 전액 환불
        User user = userRepository.findByWebUserId(request.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        pointHistoryService.refundAdvertisementPoints(user, request.getTotalCost(), "대기열 광고 취소");
        
        // 상태 변경
        request.setStatus(AdvertisementStatus.CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        request.setRefundAmount(request.getTotalCost());
        requestRepository.save(request);
        
        // 취소 알림 발송
        notificationService.sendAdvertisementCancelledNotification(request, request.getTotalCost(), "사용자 요청에 의한 취소");
        
        // 대기열 재정렬
        if (request.getQueuePosition() != null) {
            requestRepository.decrementQueuePositions(request.getQueuePosition());
        }
        
        log.info("대기열 광고 취소: requestId={}, refund={}", requestId, request.getTotalCost());
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId"),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE + "_carousel", allEntries = true)
    })
    public void cancelActiveAdvertisement(UUID requestId) {
        ThemeAdvertisementRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("광고 신청을 찾을 수 없습니다."));
        
        if (request.getStatus() != AdvertisementStatus.ACTIVE) {
            throw new IllegalStateException("활성 상태의 광고만 취소할 수 있습니다.");
        }
        
        // 남은 일수 계산 (내림 처리)
        long remainingDays = java.time.Duration.between(LocalDateTime.now(), request.getExpiresAt()).toDays();
        if (remainingDays < 0) remainingDays = 0;
        
        int refundAmount = (int) remainingDays * COST_PER_DAY;
        
        // 사용자 조회 및 부분 환불
        User user = userRepository.findByWebUserId(request.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        if (refundAmount > 0) {
            pointHistoryService.refundAdvertisementPoints(user, refundAmount,
                "활성 광고 중도 취소 (남은 일수: " + remainingDays + "일)");
        }
        
        // 상태 변경
        request.setStatus(AdvertisementStatus.CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        request.setRefundAmount(refundAmount);
        requestRepository.save(request);
        
        // 취소 알림 발송
        notificationService.sendAdvertisementCancelledNotification(request, refundAmount, "사용자 요청에 의한 중도 취소");
        
        // 대기열에서 다음 광고 활성화
        activateNextFromQueue();
        
        // 활성 광고 변경으로 인한 디스코드 봇 캐시 업데이트
        discordBotCacheService.updateActiveAdvertisementsCache();
        
        log.info("활성 광고 취소: requestId={}, remainingDays={}, refund={}", 
            requestId, remainingDays, refundAmount);
    }
    
    @Scheduled(cron = "0 0 0 * * *") // 매일 자정
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE + "_carousel", allEntries = true)
    })
    public void processExpiredAds() {
        log.info("만료된 광고 처리 시작");
        
        // 남은 일수 업데이트
        requestRepository.updateRemainingDays();
        
        // 만료된 광고 찾기
        List<ThemeAdvertisementRequest> expiredAds = 
            requestRepository.findExpiredActiveAds(LocalDateTime.now());
        
        for (ThemeAdvertisementRequest ad : expiredAds) {
            ad.setStatus(AdvertisementStatus.EXPIRED);
            requestRepository.save(ad);
            
            // 만료 알림 발송
            notificationService.sendAdvertisementExpiredNotification(ad);
            
            log.info("광고 만료 처리: requestId={}", ad.getId());
            
            // 대기열에서 다음 광고 활성화
            activateNextFromQueue();
        }
        
        // 광고 상태 변경으로 인한 디스코드 봇 캐시 업데이트
        if (!expiredAds.isEmpty()) {
            discordBotCacheService.updateActiveAdvertisementsCache();
        }
        
        log.info("만료된 광고 처리 완료: {} 건", expiredAds.size());
    }
    
    private void activateNextFromQueue() {
        long activeCount = requestRepository.countByStatus(AdvertisementStatus.ACTIVE);
        if (activeCount >= MAX_ACTIVE_ADS) {
            return;
        }
        
        Optional<ThemeAdvertisementRequest> nextAd = requestRepository.findNextQueuedAd();
        if (nextAd.isPresent()) {
            ThemeAdvertisementRequest request = nextAd.get();
            request.setStatus(AdvertisementStatus.ACTIVE);
            request.setStartedAt(LocalDateTime.now());
            request.setExpiresAt(LocalDateTime.now().plusDays(request.getRequestedDays()));
            request.setRemainingDays(request.getRequestedDays());
            request.setQueuePosition(null);
            
            requestRepository.save(request);
            
            // 활성화 알림 발송
            notificationService.sendAdvertisementActivatedNotification(request);
            
            // 새로운 광고가 활성화된 경우 디스코드 봇 캐시 업데이트
            discordBotCacheService.updateActiveAdvertisementsCache();
            
            log.info("대기열 광고 활성화: requestId={}", request.getId());
        }
    }
    
    // @Cacheable(value = CacheType.THEME_AD_ACTIVE) // 임시로 캐시 비활성화
    public List<ThemeAdvertisementRequest> getActiveAdvertisements() {
        return requestRepository.findByStatusOrderByQueuePositionAsc(AdvertisementStatus.ACTIVE);
    }
    
    /**
     * GameAdsCarousel과 호환되는 형식으로 활성 광고 목록 조회
     */
    @Cacheable(value = CacheType.THEME_AD_ACTIVE_CAROUSEL, cacheManager = "redisCacheManager")
    public List<PublicThemeAdvertisementResponse> getActiveAdvertisementsForCarousel() {
        List<ThemeAdvertisementRequest> activeAds = getActiveAdvertisements();
        log.info("활성 광고 조회 - 총 {}개 발견", activeAds.size());
        
        // 시작 시간 순으로 정렬 (최신 시작 광고가 앞으로)
        return activeAds.stream()
                .sorted((a1, a2) -> {
                    if (a1.getStartedAt() == null && a2.getStartedAt() == null) return 0;
                    if (a1.getStartedAt() == null) return 1;
                    if (a2.getStartedAt() == null) return -1;
                    return a2.getStartedAt().compareTo(a1.getStartedAt()); // 내림차순 (최신이 먼저)
                })
                .map(request -> {
                    // 테마 정보를 조회하여 포함
                    GetGameThemeResponse themeResponse = null;
                    try {
                        // 테마 타입에 따라 적절한 서비스 호출
                        switch (request.getThemeType()) {
                            case CRIMESCENE:
                            case ESCAPE_ROOM:
                                themeResponse = gameThemeService.getGameTheme(request.getThemeId());
                                break;
                            case MURDER_MYSTERY:
                            case REALWORLD:
                                // 추후 구현
                                log.warn("미구현 테마 타입: {}", request.getThemeType());
                                break;
                        }
                    } catch (Exception e) {
                        log.error("테마 정보 조회 실패: themeId={}, error={}", request.getThemeId(), e.getMessage());
                    }
                    
                    PublicThemeAdvertisementResponse response = PublicThemeAdvertisementResponse.from(request, themeResponse);
                    log.info("광고 변환 완료 - ID: {}, 테마명: {}, 테마정보 포함: {}", 
                        response.getId(), request.getThemeName(), themeResponse != null);
                    return response;
                })
                // 테마 정보가 없어도 광고는 표시 (디버깅을 위해 임시로 주석 처리)
                // .filter(response -> response.getTheme() != null)
                .collect(Collectors.toList());
    }
    
    @Cacheable(value = CacheType.THEME_AD_USER_REQUESTS, key = "#userId", cacheManager = "redisCacheManager")
    public List<ThemeAdvertisementRequest> getUserAdvertisements(UUID userId) {
        return requestRepository.findByUserIdOrderByRequestedAtDesc(userId);
    }
    
    @Cacheable(value = CacheType.THEME_AD_QUEUE, cacheManager = "redisCacheManager")
    public List<ThemeAdvertisementRequest> getQueuedAdvertisements() {
        return requestRepository.findByStatusOrderByQueuePositionAsc(AdvertisementStatus.PENDING_QUEUE);
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId"),
        @CacheEvict(value = CacheType.THEME_AD_USER_STATS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_SUMMARY, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_PLATFORM_STATS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, allEntries = true), // ThemeAdvertisements 페이지 캐시 삭제
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true) // 활성 광고 캐시 삭제
    })
    public void recordClick(UUID requestId) {
        requestRepository.incrementClickCount(requestId);
        log.debug("클릭 수 증가: requestId={}", requestId);
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId"),
        @CacheEvict(value = CacheType.THEME_AD_USER_STATS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_SUMMARY, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_PLATFORM_STATS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, allEntries = true), // ThemeAdvertisements 페이지 캐시 삭제
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true) // 활성 광고 캐시 삭제
    })
    public void recordExposure(UUID requestId) {
        requestRepository.incrementExposureCount(requestId);
        log.debug("노출 수 증가: requestId={}", requestId);
    }
    
    public Optional<ThemeAdvertisementRequest> getAdvertisementRequestById(UUID requestId) {
        return requestRepository.findById(requestId);
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE + "_carousel", allEntries = true)
    })
    public boolean forceCancelAdvertisement(UUID requestId, String reason, UUID adminUserId) {
        ThemeAdvertisementRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("광고 신청을 찾을 수 없습니다."));
        
        // 이미 취소된 광고인지 확인
        if (request.getStatus() == AdvertisementStatus.CANCELLED ||
            request.getStatus() == AdvertisementStatus.EXPIRED ||
            request.getStatus() == AdvertisementStatus.REFUNDED) {
            throw new IllegalStateException("이미 취소되었거나 완료된 광고입니다.");
        }
        
        // 사용자 조회
        User user = userRepository.findByWebUserId(request.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 원래 상태 저장 (상태 변경 전에)
        AdvertisementStatus originalStatus = request.getStatus();
        Integer originalQueuePosition = request.getQueuePosition();
        
        int refundAmount = 0;
        boolean refunded = false;
        
        if (request.getStatus() == AdvertisementStatus.PENDING_QUEUE) {
            // 대기 중인 광고는 전액 환불
            refundAmount = request.getTotalCost();
            pointHistoryService.refundAdvertisementPoints(user, refundAmount, 
                "관리자 강제 취소로 인한 환불: " + reason);
            refunded = true;
            
        } else if (request.getStatus() == AdvertisementStatus.ACTIVE) {
            // 활성 광고는 남은 일수만큼 환불 (수수료 없음)
            if (request.getRemainingDays() != null && request.getRemainingDays() > 0) {
                refundAmount = request.getRemainingDays() * COST_PER_DAY;
                pointHistoryService.refundAdvertisementPoints(user, refundAmount,
                    "관리자 강제 취소로 인한 환불 (남은 일수: " + request.getRemainingDays() + "일): " + reason);
                refunded = true;
            }
        }
        
        // 상태 변경
        request.setStatus(AdvertisementStatus.CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        request.setRefundAmount(refundAmount);
        requestRepository.save(request);
        
        // 강제 취소 알림 발송
        notificationService.sendAdvertisementCancelledNotification(request, refundAmount, "관리자 강제 취소: " + reason);
        
        // 대기열 처리 (원래 상태에 따라)
        if (originalStatus == AdvertisementStatus.PENDING_QUEUE && originalQueuePosition != null) {
            requestRepository.decrementQueuePositions(originalQueuePosition);
        } else if (originalStatus == AdvertisementStatus.ACTIVE) {
            // 활성 광고가 취소된 경우 대기열에서 다음 광고 활성화
            activateNextFromQueue();
        }
        
        // 광고 상태 변경으로 인한 디스코드 봇 캐시 업데이트
        discordBotCacheService.updateActiveAdvertisementsCache();
        
        log.info("관리자 강제 광고 취소: requestId={}, adminUserId={}, refund={}, reason={}", 
            requestId, adminUserId, refundAmount, reason);
        
        return refunded;
    }
    
    public Map<String, Object> getAdvertisementStatistics(UUID userId, UUID themeId) {
        Map<String, Object> statistics = new HashMap<>();
        
        // 기본 조건 설정
        List<ThemeAdvertisementRequest> userAds;
        if (themeId != null) {
            userAds = requestRepository.findByUserIdAndThemeIdOrderByRequestedAtDesc(userId, themeId);
        } else {
            userAds = requestRepository.findByUserIdOrderByRequestedAtDesc(userId);
        }
        
        // 전체 통계
        statistics.put("totalRequests", userAds.size());
        
        // 상태별 통계
        Map<String, Long> statusStats = userAds.stream()
            .collect(Collectors.groupingBy(
                ad -> ad.getStatus().name(),
                Collectors.counting()
            ));
        statistics.put("statusBreakdown", statusStats);
        
        // 총 지출 포인트 계산
        int totalSpent = userAds.stream()
            .mapToInt(ThemeAdvertisementRequest::getTotalCost)
            .sum();
        statistics.put("totalPointsSpent", totalSpent);
        
        // 총 환불 포인트 계산
        int totalRefunded = userAds.stream()
            .filter(ad -> ad.getRefundAmount() != null)
            .mapToInt(ThemeAdvertisementRequest::getRefundAmount)
            .sum();
        statistics.put("totalPointsRefunded", totalRefunded);
        
        // 순 지출 포인트
        statistics.put("netPointsSpent", totalSpent - totalRefunded);
        
        // 클릭/노출 통계
        int totalClicks = userAds.stream()
            .filter(ad -> ad.getClickCount() != null)
            .mapToInt(ThemeAdvertisementRequest::getClickCount)
            .sum();
        statistics.put("totalClicks", totalClicks);
        
        int totalExposures = userAds.stream()
            .filter(ad -> ad.getExposureCount() != null)
            .mapToInt(ThemeAdvertisementRequest::getExposureCount)
            .sum();
        statistics.put("totalExposures", totalExposures);
        
        // 평균 CTR 계산 (Click Through Rate)
        double averageCTR = totalExposures > 0 ? (double) totalClicks / totalExposures * 100 : 0.0;
        statistics.put("averageClickThroughRate", Math.round(averageCTR * 100.0) / 100.0);
        
        // 테마별 통계 (themeId가 지정되지 않은 경우)
        if (themeId == null) {
            Map<String, Object> themeStats = userAds.stream()
                .collect(Collectors.groupingBy(
                    ThemeAdvertisementRequest::getThemeName,
                    Collectors.collectingAndThen(
                        Collectors.toList(),
                        ads -> {
                            Map<String, Object> stats = new HashMap<>();
                            stats.put("requestCount", ads.size());
                            stats.put("totalCost", ads.stream().mapToInt(ThemeAdvertisementRequest::getTotalCost).sum());
                            stats.put("totalClicks", ads.stream().mapToInt(ad -> ad.getClickCount() != null ? ad.getClickCount() : 0).sum());
                            stats.put("totalExposures", ads.stream().mapToInt(ad -> ad.getExposureCount() != null ? ad.getExposureCount() : 0).sum());
                            return stats;
                        }
                    )
                ));
            statistics.put("themeBreakdown", themeStats);
        }
        
        // 최근 활동 (최근 5개 광고)
        List<Map<String, Object>> recentActivity = userAds.stream()
            .limit(5)
            .map(ad -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("requestId", ad.getId());
                activity.put("themeName", ad.getThemeName());
                activity.put("themeType", ad.getThemeType());
                activity.put("status", ad.getStatus());
                activity.put("requestedAt", ad.getRequestedAt());
                activity.put("totalCost", ad.getTotalCost());
                activity.put("clickCount", ad.getClickCount());
                activity.put("exposureCount", ad.getExposureCount());
                return activity;
            })
            .collect(Collectors.toList());
        statistics.put("recentActivity", recentActivity);
        
        // 성과 지표
        Map<String, Object> performance = new HashMap<>();
        performance.put("averageClicksPerAd", userAds.isEmpty() ? 0 : (double) totalClicks / userAds.size());
        performance.put("averageExposuresPerAd", userAds.isEmpty() ? 0 : (double) totalExposures / userAds.size());
        performance.put("averageCostPerClick", totalClicks > 0 ? (double) totalSpent / totalClicks : 0);
        performance.put("averageCostPerExposure", totalExposures > 0 ? (double) totalSpent / totalExposures : 0);
        statistics.put("performance", performance);
        
        return statistics;
    }
}