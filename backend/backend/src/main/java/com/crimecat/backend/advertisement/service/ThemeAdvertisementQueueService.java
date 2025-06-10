package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.point.service.PointHistoryService;
import com.crimecat.backend.user.domain.User;
import com.crimecat.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, key = "#userId"),
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true)
    })
    public ThemeAdvertisementRequest requestAdvertisement(UUID userId, UUID themeId, String themeName, 
                                                        ThemeAdvertisementRequest.ThemeType themeType, 
                                                        int requestedDays) {
        // 1. 입력 검증
        if (requestedDays <= 0 || requestedDays > MAX_DAYS_PER_AD) {
            throw new IllegalArgumentException("광고 기간은 1일 이상 " + MAX_DAYS_PER_AD + "일 이하로 설정해야 합니다.");
        }
        
        // 2. 비용 계산
        int totalCost = requestedDays * COST_PER_DAY;
        
        // 2. 사용자 조회 및 포인트 잔액 확인
        User user = userRepository.findByWebUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        boolean deducted = pointHistoryService.usePointsForAdvertisement(user, totalCost, 
            "테마 광고 신청: " + themeName + " (" + requestedDays + "일)");
        if (!deducted) {
            throw new IllegalStateException("포인트가 부족합니다. 필요 포인트: " + totalCost);
        }
        
        try {
            // 3. 광고 신청 생성
            ThemeAdvertisementRequest request = ThemeAdvertisementRequest.builder()
                .userId(userId)
                .themeId(themeId)
                .themeName(themeName)
                .themeType(themeType)
                .requestedDays(requestedDays)
                .totalCost(totalCost)
                .build();
            
            // 4. 활성 광고 수 확인
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
            
            return requestRepository.save(request);
            
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
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true)
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
        
        // 대기열 재정렬
        if (request.getQueuePosition() != null) {
            requestRepository.decrementQueuePositions(request.getQueuePosition());
        }
        
        log.info("대기열 광고 취소: requestId={}, refund={}", requestId, request.getTotalCost());
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_USER_REQUESTS, key = "#request.userId"),
        @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId")
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
        
        // 대기열에서 다음 광고 활성화
        activateNextFromQueue();
        
        log.info("활성 광고 취소: requestId={}, remainingDays={}, refund={}", 
            requestId, remainingDays, refundAmount);
    }
    
    @Scheduled(cron = "0 0 0 * * *") // 매일 자정
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheType.THEME_AD_ACTIVE, allEntries = true),
        @CacheEvict(value = CacheType.THEME_AD_QUEUE, allEntries = true)
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
            log.info("광고 만료 처리: requestId={}", ad.getId());
            
            // 대기열에서 다음 광고 활성화
            activateNextFromQueue();
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
            log.info("대기열 광고 활성화: requestId={}", request.getId());
        }
    }
    
    @Cacheable(value = CacheType.THEME_AD_ACTIVE)
    public List<ThemeAdvertisementRequest> getActiveAdvertisements() {
        return requestRepository.findByStatusOrderByQueuePositionAsc(AdvertisementStatus.ACTIVE);
    }
    
    @Cacheable(value = CacheType.THEME_AD_USER_REQUESTS, key = "#userId")
    public List<ThemeAdvertisementRequest> getUserAdvertisements(UUID userId) {
        return requestRepository.findByUserIdOrderByRequestedAtDesc(userId);
    }
    
    @Cacheable(value = CacheType.THEME_AD_QUEUE)
    public List<ThemeAdvertisementRequest> getQueuedAdvertisements() {
        return requestRepository.findByStatusOrderByQueuePositionAsc(AdvertisementStatus.PENDING_QUEUE);
    }
    
    @Transactional
    @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId")
    public void recordClick(UUID requestId) {
        requestRepository.incrementClickCount(requestId);
    }
    
    @Transactional
    @CacheEvict(value = CacheType.THEME_AD_STATS, key = "#requestId")
    public void recordExposure(UUID requestId) {
        requestRepository.incrementExposureCount(requestId);
    }
}