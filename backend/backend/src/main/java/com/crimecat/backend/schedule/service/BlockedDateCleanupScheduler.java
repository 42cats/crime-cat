package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheNames;
import com.crimecat.backend.schedule.repository.RecommendedTimeRepository;
import com.crimecat.backend.schedule.repository.UserBlockedPeriodRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 비활성 날짜 및 추천 시간 데이터 자동 정리 스케줄러
 * 매월 1일 새벽 2시에 실행되어 과거 데이터를 자동으로 정리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BlockedDateCleanupScheduler {

    private final UserBlockedPeriodRepository userBlockedPeriodRepository;
    private final RecommendedTimeRepository recommendedTimeRepository;

    /**
     * 매월 1일 새벽 2시에 만료된 비활성 날짜 기간 삭제
     */
    @Scheduled(cron = "0 0 2 1 * ?")
    @Transactional
    @CacheEvict(value = {
        CacheNames.SCHEDULE_USER_BLOCKED_DATES,
        CacheNames.SCHEDULE_RECOMMENDED_TIMES,
        CacheNames.SCHEDULE_AVAILABILITY
    }, allEntries = true)
    public void cleanupExpiredPeriods() {
        log.info("Starting monthly cleanup of expired blocked date periods...");
        
        try {
            LocalDate currentPeriodStart = LocalDate.now().withDayOfMonth(1);
            LocalDate expiredBefore = currentPeriodStart.minusMonths(1);
            
            // 삭제 전 통계 수집
            long expiredCount = userBlockedPeriodRepository.countByPeriodStartBefore(expiredBefore);
            long totalCount = userBlockedPeriodRepository.count();
            
            log.info("Found {} expired periods out of {} total periods (expiry cutoff: {})", 
                    expiredCount, totalCount, expiredBefore);
            
            // 지난 기간 데이터 일괄 삭제
            int deletedCount = userBlockedPeriodRepository.deleteByPeriodStartBefore(expiredBefore);
            
            log.info("Successfully cleaned up {} expired blocked date periods", deletedCount);
            
            // 삭제 후 통계
            long remainingCount = userBlockedPeriodRepository.count();
            log.info("Remaining blocked date periods: {}", remainingCount);
            
        } catch (Exception e) {
            log.error("Error during blocked date cleanup", e);
        }
    }

    /**
     * 매주 일요일 새벽 3시에 과거 추천 시간 데이터 정리
     */
    @Scheduled(cron = "0 0 3 * * SUN")
    @Transactional
    @CacheEvict(value = {
        CacheNames.SCHEDULE_RECOMMENDED_TIMES,
        CacheNames.SCHEDULE_AVAILABILITY
    }, allEntries = true)
    public void cleanupExpiredRecommendedTimes() {
        log.info("Starting weekly cleanup of expired recommended times...");
        
        try {
            LocalDateTime cutoffTime = LocalDateTime.now().minusDays(7); // 1주일 이전 데이터 삭제
            
            int deletedCount = recommendedTimeRepository.deleteByEndTimeBefore(cutoffTime);
            
            log.info("Successfully cleaned up {} expired recommended times (cutoff: {})", 
                    deletedCount, cutoffTime);
                    
        } catch (Exception e) {
            log.error("Error during recommended times cleanup", e);
        }
    }

    /**
     * 매일 오전 6시에 캐시 예열 및 정리
     */
    @Scheduled(cron = "0 0 6 * * ?")
    @CacheEvict(value = {
        CacheNames.SCHEDULE_USER_BLOCKED_DATES,
        CacheNames.SCHEDULE_RECOMMENDED_TIMES,
        CacheNames.SCHEDULE_AVAILABILITY
    }, allEntries = true)
    public void dailyCacheWarmup() {
        log.debug("Performing daily cache cleanup and warmup");
        
        try {
            // 캐시 무효화 후 통계 로깅
            long totalBlockedPeriods = userBlockedPeriodRepository.count();
            log.debug("Total blocked date periods in system: {}", totalBlockedPeriods);
            
        } catch (Exception e) {
            log.error("Error during daily cache warmup", e);
        }
    }

    /**
     * 수동 정리 트리거 (관리자용)
     */
    @Transactional
    @CacheEvict(value = {
        CacheNames.SCHEDULE_USER_BLOCKED_DATES,
        CacheNames.SCHEDULE_RECOMMENDED_TIMES,
        CacheNames.SCHEDULE_AVAILABILITY
    }, allEntries = true)
    public void manualCleanup() {
        log.info("Manual cleanup triggered by administrator");
        
        // 만료된 비활성 날짜 기간 정리
        cleanupExpiredPeriods();
        
        // 만료된 추천 시간 정리
        cleanupExpiredRecommendedTimes();
        
        log.info("Manual cleanup completed");
    }

    /**
     * 시스템 상태 정보 조회 (모니터링용)
     */
    @Transactional(readOnly = true)
    public SystemCleanupStats getCleanupStats() {
        try {
            LocalDate currentPeriod = LocalDate.now().withDayOfMonth(1);
            LocalDate previousPeriod = currentPeriod.minusMonths(1);
            
            long totalBlockedPeriods = userBlockedPeriodRepository.count();
            long expiredBlockedPeriods = userBlockedPeriodRepository.countByPeriodStartBefore(previousPeriod);
            
            return SystemCleanupStats.builder()
                .totalBlockedPeriods(totalBlockedPeriods)
                .expiredBlockedPeriods(expiredBlockedPeriods)
                .currentPeriodStart(currentPeriod)
                .lastCleanupThreshold(previousPeriod)
                .build();
                
        } catch (Exception e) {
            log.error("Error retrieving cleanup stats", e);
            return SystemCleanupStats.builder()
                .totalBlockedPeriods(0L)
                .expiredBlockedPeriods(0L)
                .currentPeriodStart(LocalDate.now())
                .lastCleanupThreshold(LocalDate.now())
                .build();
        }
    }

    /**
     * 정리 통계 정보를 담는 내부 클래스
     */
    public static class SystemCleanupStats {
        private final long totalBlockedPeriods;
        private final long expiredBlockedPeriods;
        private final LocalDate currentPeriodStart;
        private final LocalDate lastCleanupThreshold;

        public SystemCleanupStats(long totalBlockedPeriods, long expiredBlockedPeriods, 
                                 LocalDate currentPeriodStart, LocalDate lastCleanupThreshold) {
            this.totalBlockedPeriods = totalBlockedPeriods;
            this.expiredBlockedPeriods = expiredBlockedPeriods;
            this.currentPeriodStart = currentPeriodStart;
            this.lastCleanupThreshold = lastCleanupThreshold;
        }

        public static SystemCleanupStatsBuilder builder() {
            return new SystemCleanupStatsBuilder();
        }

        public long getTotalBlockedPeriods() { return totalBlockedPeriods; }
        public long getExpiredBlockedPeriods() { return expiredBlockedPeriods; }
        public LocalDate getCurrentPeriodStart() { return currentPeriodStart; }
        public LocalDate getLastCleanupThreshold() { return lastCleanupThreshold; }

        public static class SystemCleanupStatsBuilder {
            private long totalBlockedPeriods;
            private long expiredBlockedPeriods;
            private LocalDate currentPeriodStart;
            private LocalDate lastCleanupThreshold;

            public SystemCleanupStatsBuilder totalBlockedPeriods(long totalBlockedPeriods) {
                this.totalBlockedPeriods = totalBlockedPeriods;
                return this;
            }

            public SystemCleanupStatsBuilder expiredBlockedPeriods(long expiredBlockedPeriods) {
                this.expiredBlockedPeriods = expiredBlockedPeriods;
                return this;
            }

            public SystemCleanupStatsBuilder currentPeriodStart(LocalDate currentPeriodStart) {
                this.currentPeriodStart = currentPeriodStart;
                return this;
            }

            public SystemCleanupStatsBuilder lastCleanupThreshold(LocalDate lastCleanupThreshold) {
                this.lastCleanupThreshold = lastCleanupThreshold;
                return this;
            }

            public SystemCleanupStats build() {
                return new SystemCleanupStats(totalBlockedPeriods, expiredBlockedPeriods, 
                                            currentPeriodStart, lastCleanupThreshold);
            }
        }
    }
}