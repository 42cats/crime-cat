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
}