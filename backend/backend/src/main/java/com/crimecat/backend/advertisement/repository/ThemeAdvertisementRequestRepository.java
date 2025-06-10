package com.crimecat.backend.advertisement.repository;

import com.crimecat.backend.advertisement.domain.AdvertisementStatus;
import com.crimecat.backend.advertisement.domain.ThemeAdvertisementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ThemeAdvertisementRequestRepository extends JpaRepository<ThemeAdvertisementRequest, UUID> {
    
    // 사용자별 광고 신청 목록 조회
    List<ThemeAdvertisementRequest> findByUserIdOrderByRequestedAtDesc(UUID userId);
    
    // 특정 상태의 광고 조회
    List<ThemeAdvertisementRequest> findByStatusOrderByQueuePositionAsc(AdvertisementStatus status);
    
    // 활성 광고 수 조회
    long countByStatus(AdvertisementStatus status);
    
    // 만료된 광고 조회
    @Query("SELECT tar FROM ThemeAdvertisementRequest tar WHERE tar.status = 'ACTIVE' AND tar.expiresAt <= :now")
    List<ThemeAdvertisementRequest> findExpiredActiveAds(@Param("now") LocalDateTime now);
    
    // 다음 대기열 광고 조회
    @Query("SELECT tar FROM ThemeAdvertisementRequest tar WHERE tar.status = 'PENDING_QUEUE' ORDER BY tar.queuePosition ASC")
    Optional<ThemeAdvertisementRequest> findNextQueuedAd();
    
    // 큐 포지션 재정렬
    @Modifying
    @Query("UPDATE ThemeAdvertisementRequest tar SET tar.queuePosition = tar.queuePosition - 1 WHERE tar.status = 'PENDING_QUEUE' AND tar.queuePosition > :position")
    void decrementQueuePositions(@Param("position") Integer position);
    
    // 특정 테마의 활성 광고 존재 여부 확인
    boolean existsByThemeIdAndStatus(UUID themeId, AdvertisementStatus status);
    
    // 사용자의 특정 상태 광고 조회
    List<ThemeAdvertisementRequest> findByUserIdAndStatusIn(UUID userId, List<AdvertisementStatus> statuses);
    
    // 통계 업데이트
    @Modifying
    @Query("UPDATE ThemeAdvertisementRequest tar SET tar.clickCount = tar.clickCount + 1 WHERE tar.id = :id")
    void incrementClickCount(@Param("id") UUID id);
    
    @Modifying
    @Query("UPDATE ThemeAdvertisementRequest tar SET tar.exposureCount = tar.exposureCount + 1 WHERE tar.id = :id")
    void incrementExposureCount(@Param("id") UUID id);
    
    // 남은 일수 업데이트
    @Modifying
    @Query("UPDATE ThemeAdvertisementRequest tar SET tar.remainingDays = DATEDIFF(tar.expiresAt, CURRENT_TIMESTAMP) WHERE tar.status = 'ACTIVE'")
    void updateRemainingDays();
    
    // 큐에서 가장 높은 포지션 조회
    @Query("SELECT MAX(tar.queuePosition) FROM ThemeAdvertisementRequest tar WHERE tar.status = 'PENDING_QUEUE'")
    Optional<Integer> findMaxQueuePosition();
    
    // ===== 통계 관련 쿼리 =====
    
    // 사용자별 광고 통계 - 개수
    @Query("SELECT COUNT(tar) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId")
    Long countByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COUNT(tar) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId AND tar.status = :status")
    Long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") AdvertisementStatus status);
    
    // 사용자별 광고 통계 - 비용
    @Query("SELECT COALESCE(SUM(tar.totalCost), 0) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId")
    Integer sumTotalCostByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COALESCE(SUM(tar.refundAmount), 0) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId AND tar.refundAmount IS NOT NULL")
    Integer sumRefundAmountByUserId(@Param("userId") UUID userId);
    
    // 사용자별 광고 통계 - 성과
    @Query("SELECT COALESCE(SUM(tar.exposureCount), 0) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId")
    Long sumExposureCountByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT COALESCE(SUM(tar.clickCount), 0) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId")
    Long sumClickCountByUserId(@Param("userId") UUID userId);
    
    // 사용자의 가장 성과 좋은 테마
    @Query("SELECT tar.themeName FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId AND tar.exposureCount > 0 ORDER BY (CAST(tar.clickCount AS double) / CAST(tar.exposureCount AS double)) DESC")
    Optional<String> findBestPerformingThemeByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT MAX(CASE WHEN tar.exposureCount > 0 THEN (CAST(tar.clickCount AS double) / CAST(tar.exposureCount AS double)) * 100.0 ELSE 0.0 END) FROM ThemeAdvertisementRequest tar WHERE tar.userId = :userId")
    Optional<Double> findBestPerformingCTRByUserId(@Param("userId") UUID userId);
    
    // 플랫폼 전체 통계
    @Query("SELECT COALESCE(SUM(tar.totalCost), 0) FROM ThemeAdvertisementRequest tar")
    Integer sumAllTotalCost();
    
    @Query("SELECT COALESCE(SUM(tar.exposureCount), 0) FROM ThemeAdvertisementRequest tar")
    Long sumAllExposureCount();
    
    @Query("SELECT COALESCE(SUM(tar.clickCount), 0) FROM ThemeAdvertisementRequest tar")
    Long sumAllClickCount();
    
    // 인기 테마 순위 (CTR 기준)
    @Query("SELECT tar.themeName, tar.themeType, " +
           "COALESCE(SUM(tar.exposureCount), 0) as totalExposures, " +
           "COALESCE(SUM(tar.clickCount), 0) as totalClicks " +
           "FROM ThemeAdvertisementRequest tar " +
           "WHERE tar.exposureCount > 0 " +
           "GROUP BY tar.themeName, tar.themeType " +
           "ORDER BY (CAST(SUM(tar.clickCount) AS double) / CAST(SUM(tar.exposureCount) AS double)) DESC")
    List<Object[]> findTopPerformingThemesByCTR();
    
    // 가장 활발한 테마 순위 (노출수 기준)
    @Query("SELECT tar.themeName, tar.themeType, " +
           "COALESCE(SUM(tar.exposureCount), 0) as totalExposures, " +
           "COALESCE(SUM(tar.clickCount), 0) as totalClicks " +
           "FROM ThemeAdvertisementRequest tar " +
           "GROUP BY tar.themeName, tar.themeType " +
           "ORDER BY SUM(tar.exposureCount) DESC")
    List<Object[]> findMostActiveThemes();
    
    // 평균 통계
    @Query("SELECT AVG(CASE WHEN tar.exposureCount > 0 THEN (CAST(tar.clickCount AS double) / CAST(tar.exposureCount AS double)) * 100.0 ELSE 0.0 END) FROM ThemeAdvertisementRequest tar WHERE tar.exposureCount > 0")
    Optional<Double> findAverageCTR();
    
    @Query("SELECT AVG(CASE WHEN tar.clickCount > 0 THEN CAST(tar.totalCost AS double) / CAST(tar.clickCount AS double) ELSE NULL END) FROM ThemeAdvertisementRequest tar WHERE tar.clickCount > 0")
    Optional<Double> findAverageCostPerClick();
    
    @Query("SELECT AVG(CASE WHEN tar.exposureCount > 0 THEN CAST(tar.totalCost AS double) / CAST(tar.exposureCount AS double) ELSE NULL END) FROM ThemeAdvertisementRequest tar WHERE tar.exposureCount > 0")
    Optional<Double> findAverageCostPerExposure();
}