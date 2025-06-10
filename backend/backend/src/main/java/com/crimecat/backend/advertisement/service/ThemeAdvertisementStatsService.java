package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import com.crimecat.backend.advertisement.dto.AdvertisementStatsResponse;
import com.crimecat.backend.advertisement.dto.PlatformAdvertisementStats;
import com.crimecat.backend.advertisement.dto.UserAdvertisementSummary;
import com.crimecat.backend.advertisement.repository.ThemeAdvertisementRequestRepository;
import com.crimecat.backend.config.CacheType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 테마 광고 통계 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ThemeAdvertisementStatsService {
    
    private final ThemeAdvertisementRequestRepository requestRepository;
    
    /**
     * 사용자별 광고 상세 통계 조회
     */
    @Cacheable(value = CacheType.THEME_AD_USER_STATS, key = "#userId")
    public List<AdvertisementStatsResponse> getUserAdvertisementStats(UUID userId) {
        List<ThemeAdvertisementRequest> requests = requestRepository.findByUserIdOrderByRequestedAtDesc(userId);
        
        return requests.stream()
                .map(this::convertToStatsResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 사용자별 광고 요약 통계
     */
    @Cacheable(value = CacheType.THEME_AD_USER_SUMMARY, key = "#userId")
    public UserAdvertisementSummary getUserAdvertisementSummary(UUID userId) {
        // 기본 개수 통계
        Long totalAds = requestRepository.countByUserId(userId);
        Long activeAds = requestRepository.countByUserIdAndStatus(userId, AdvertisementStatus.ACTIVE);
        Long completedAds = requestRepository.countByUserIdAndStatus(userId, AdvertisementStatus.EXPIRED);
        Long queuedAds = requestRepository.countByUserIdAndStatus(userId, AdvertisementStatus.PENDING_QUEUE);
        
        // 비용 통계
        Integer totalSpent = requestRepository.sumTotalCostByUserId(userId);
        Integer totalRefunded = requestRepository.sumRefundAmountByUserId(userId);
        Integer netSpent = totalSpent - totalRefunded;
        
        // 성과 통계
        Long totalExposures = requestRepository.sumExposureCountByUserId(userId);
        Long totalClicks = requestRepository.sumClickCountByUserId(userId);
        
        // 최고 성과 테마
        String bestTheme = requestRepository.findBestPerformingThemeByUserId(userId).orElse(null);
        Double bestCTR = requestRepository.findBestPerformingCTRByUserId(userId).orElse(0.0);
        
        return UserAdvertisementSummary.builder()
                .totalAdvertisements(totalAds)
                .activeAdvertisements(activeAds)
                .completedAdvertisements(completedAds)
                .queuedAdvertisements(queuedAds)
                .totalSpent(totalSpent)
                .totalRefunded(totalRefunded)
                .netSpent(netSpent)
                .totalExposures(totalExposures)
                .totalClicks(totalClicks)
                .bestPerformingTheme(bestTheme)
                .bestPerformingCTR(bestCTR)
                .build();
    }
    
    /**
     * 플랫폼 전체 통계
     */
    @Cacheable(value = CacheType.THEME_AD_PLATFORM_STATS)
    public PlatformAdvertisementStats getPlatformStats() {
        // 기본 개수 통계
        Long totalAds = requestRepository.count();
        Long activeAds = requestRepository.countByStatus(AdvertisementStatus.ACTIVE);
        Long queuedAds = requestRepository.countByStatus(AdvertisementStatus.PENDING_QUEUE);
        
        // 수익 통계
        Integer totalRevenue = requestRepository.sumAllTotalCost();
        
        // 성과 통계
        Long totalExposures = requestRepository.sumAllExposureCount();
        Long totalClicks = requestRepository.sumAllClickCount();
        
        // 인기 테마 순위
        List<PlatformAdvertisementStats.PopularThemeStats> topPerformingThemes = 
                convertToPopularThemeStats(requestRepository.findTopPerformingThemesByCTR(), true);
        
        List<PlatformAdvertisementStats.PopularThemeStats> mostActiveThemes = 
                convertToPopularThemeStats(requestRepository.findMostActiveThemes(), false);
        
        // 벤치마크 데이터
        Double avgCTR = requestRepository.findAverageCTR().orElse(0.0);
        Double avgCostPerClick = requestRepository.findAverageCostPerClick().orElse(0.0);
        Double avgCostPerExposure = requestRepository.findAverageCostPerExposure().orElse(0.0);
        
        return PlatformAdvertisementStats.builder()
                .totalAdvertisements(totalAds)
                .activeAdvertisements(activeAds)
                .queuedAdvertisements(queuedAds)
                .totalRevenue(totalRevenue)
                .totalExposures(totalExposures)
                .totalClicks(totalClicks)
                .topPerformingThemes(new ArrayList<>(topPerformingThemes.subList(0, Math.min(10, topPerformingThemes.size()))))
                .mostActiveThemes(new ArrayList<>(mostActiveThemes.subList(0, Math.min(10, mostActiveThemes.size()))))
                .averageCTR(avgCTR)
                .averageCostPerClick(avgCostPerClick)
                .averageCostPerExposure(avgCostPerExposure)
                .build();
    }
    
    /**
     * 특정 광고의 상세 통계
     */
    @Cacheable(value = CacheType.THEME_AD_STATS, key = "#requestId")
    public AdvertisementStatsResponse getAdvertisementStats(UUID requestId) {
        ThemeAdvertisementRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("광고 신청을 찾을 수 없습니다."));
        
        return convertToStatsResponse(request);
    }
    
    /**
     * 특정 광고가 해당 사용자의 것인지 확인
     */
    public boolean isUserAdvertisement(UUID requestId, UUID userId) {
        return requestRepository.findById(requestId)
                .map(request -> request.getUserId().equals(userId))
                .orElse(false);
    }
    
    /**
     * ThemeAdvertisementRequest를 AdvertisementStatsResponse로 변환
     */
    private AdvertisementStatsResponse convertToStatsResponse(ThemeAdvertisementRequest request) {
        return AdvertisementStatsResponse.builder()
                .requestId(request.getId())
                .themeName(request.getThemeName())
                .themeType(request.getThemeType())
                .status(request.getStatus().name())
                .totalCost(request.getTotalCost())
                .requestedDays(request.getRequestedDays())
                .remainingDays(request.getRemainingDays())
                .exposureCount(request.getExposureCount() != null ? request.getExposureCount() : 0L)
                .clickCount(request.getClickCount() != null ? request.getClickCount() : 0L)
                .startedAt(request.getStartedAt())
                .expiresAt(request.getExpiresAt())
                .requestedAt(request.getRequestedAt())
                .build();
    }
    
    /**
     * Object[] 결과를 PopularThemeStats로 변환
     */
    private List<PlatformAdvertisementStats.PopularThemeStats> convertToPopularThemeStats(
            List<Object[]> results, boolean isCTROrder) {
        
        List<PlatformAdvertisementStats.PopularThemeStats> stats = new ArrayList<>();
        
        for (int i = 0; i < results.size(); i++) {
            Object[] result = results.get(i);
            String themeName = (String) result[0];
            ThemeAdvertisementRequest.ThemeType themeType = (ThemeAdvertisementRequest.ThemeType) result[1];
            Long exposures = ((Number) result[2]).longValue();
            Long clicks = ((Number) result[3]).longValue();
            
            Double ctr = exposures > 0 ? (clicks.doubleValue() / exposures.doubleValue()) * 100.0 : 0.0;
            
            stats.add(PlatformAdvertisementStats.PopularThemeStats.builder()
                    .themeName(themeName)
                    .themeType(themeType)
                    .exposureCount(exposures)
                    .clickCount(clicks)
                    .ctr(ctr)
                    .rank(i + 1)
                    .build());
        }
        
        return stats;
    }
}