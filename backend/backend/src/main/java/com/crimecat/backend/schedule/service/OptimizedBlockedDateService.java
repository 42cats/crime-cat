package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.schedule.domain.UserBlockedPeriod;
import com.crimecat.backend.schedule.repository.UserBlockedPeriodRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * 비트맵 기반 최적화된 비활성 날짜 관리 서비스
 * 3개월(90일)을 12바이트 비트맵으로 압축하여 O(1) 연산 제공
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class OptimizedBlockedDateService {

    private static final int PERIOD_DAYS = 90; // 3개월
    private static final int BITMAP_BYTES = 12; // 90비트 = 12바이트
    
    private final UserBlockedPeriodRepository userBlockedPeriodRepository;

    /**
     * 현재 기준 3개월 기간의 시작일 계산 (매월 1일 기준)
     */
    private LocalDate getCurrentPeriodStart() {
        return LocalDate.now().withDayOfMonth(1);
    }

    /**
     * 날짜를 비트 인덱스로 변환 (O(1))
     */
    private int dateToBitIndex(LocalDate date, LocalDate periodStart) {
        return (int) ChronoUnit.DAYS.between(periodStart, date);
    }

    /**
     * 기간 정보를 가져오거나 새로 생성
     */
    private UserBlockedPeriod getOrCreatePeriod(UUID userId, LocalDate periodStart) {
        Optional<UserBlockedPeriod> existing = userBlockedPeriodRepository
            .findByUserIdAndPeriodStart(userId, periodStart);
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // 새로운 기간 생성 (모든 비트 0으로 초기화)
        byte[] initialBitmap = new byte[BITMAP_BYTES];
        Arrays.fill(initialBitmap, (byte) 0);
        
        UserBlockedPeriod newPeriod = UserBlockedPeriod.builder()
            .user(WebUser.builder().id(userId).build()) // Lazy loading을 위한 프록시 생성
            .periodStart(periodStart)
            .blockedDaysBitmap(initialBitmap)
            .build();
        
        return userBlockedPeriodRepository.save(newPeriod);
    }

    /**
     * 특정 날짜를 비활성화 (O(1))
     */
    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, allEntries = true)
    })
    public void blockDate(UUID userId, LocalDate date) {
        log.info("🔒 [BLOCK] Starting blockDate for user={} date={}", userId, date);
        
        LocalDate periodStart = getCurrentPeriodStart();
        int bitIndex = dateToBitIndex(date, periodStart);
        
        log.debug("🔒 [BLOCK] Calculated periodStart={} bitIndex={}", periodStart, bitIndex);
        
        if (bitIndex < 0 || bitIndex >= PERIOD_DAYS) {
            log.warn("🔒 [BLOCK] Date {} is out of current period range ({}), ignoring block request", date, periodStart);
            return; // 범위 밖 날짜는 무시
        }
        
        try {
            UserBlockedPeriod period = getOrCreatePeriod(userId, periodStart);
            log.debug("🔒 [BLOCK] Retrieved/created period for user={} periodId={}", userId, period.getId());
            
            byte[] bitmap = period.getBlockedDaysBitmap();
            
            // 특정 비트 설정 (1 = 비활성화)
            int byteIndex = bitIndex / 8;
            int bitOffset = bitIndex % 8;
            
            boolean wasAlreadyBlocked = (bitmap[byteIndex] & (1 << bitOffset)) != 0;
            bitmap[byteIndex] |= (1 << bitOffset);
            
            period.setBlockedDaysBitmap(bitmap);
            UserBlockedPeriod savedPeriod = userBlockedPeriodRepository.save(period);
            
            log.info("🔒 [BLOCK] Successfully blocked date {} for user {} at bit index {} (wasAlreadyBlocked={})", 
                date, userId, bitIndex, wasAlreadyBlocked);
            log.debug("🔒 [BLOCK] Saved period ID={} with bitmap length={}", savedPeriod.getId(), bitmap.length);
            
        } catch (Exception e) {
            log.error("🔒 [BLOCK] Failed to block date {} for user {}: {}", date, userId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * 날짜 범위 일괄 비활성화 (드래그 선택)
     */
    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, allEntries = true)
    })
    public void blockDateRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.info("🔒📅 [BLOCK_RANGE] Starting blockDateRange for user={} from={} to={}", userId, startDate, endDate);
        
        if (startDate.isAfter(endDate)) {
            log.warn("🔒📅 [BLOCK_RANGE] Start date {} is after end date {}, swapping", startDate, endDate);
            LocalDate temp = startDate;
            startDate = endDate;
            endDate = temp;
        }
        
        LocalDate current = startDate;
        int blockedCount = 0;
        int skippedCount = 0;
        
        while (!current.isAfter(endDate)) {
            try {
                log.debug("🔒📅 [BLOCK_RANGE] Processing date {} ({})", current, blockedCount + 1);
                blockDate(userId, current);
                blockedCount++;
            } catch (Exception e) {
                log.error("🔒📅 [BLOCK_RANGE] Failed to block date {} for user {}: {}", current, userId, e.getMessage());
                skippedCount++;
            }
            
            current = current.plusDays(1);
            
            // 안전장치: 너무 많은 날짜를 한번에 블록하는 것을 방지
            if (blockedCount + skippedCount > 90) {
                log.warn("🔒📅 [BLOCK_RANGE] Too many dates to block in range {} to {}, stopping at {} (processed={})", 
                    startDate, endDate, current, blockedCount + skippedCount);
                break;
            }
        }
        
        log.info("🔒📅 [BLOCK_RANGE] Completed: blocked={} skipped={} dates from {} to {} for user {}", 
            blockedCount, skippedCount, startDate, endDate, userId);
    }

    /**
     * 특정 날짜를 활성화 (O(1))
     */
    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, allEntries = true)
    })
    public void unblockDate(UUID userId, LocalDate date) {
        LocalDate periodStart = getCurrentPeriodStart();
        int bitIndex = dateToBitIndex(date, periodStart);
        
        if (bitIndex < 0 || bitIndex >= PERIOD_DAYS) {
            log.warn("Date {} is out of current period range ({}), ignoring unblock request", date, periodStart);
            return;
        }
        
        Optional<UserBlockedPeriod> periodOpt = userBlockedPeriodRepository
            .findByUserIdAndPeriodStart(userId, periodStart);
            
        if (periodOpt.isEmpty()) {
            log.debug("No blocked period found for user {} and period {}, nothing to unblock", userId, periodStart);
            return; // 블록된 기간이 없으면 무시
        }
        
        UserBlockedPeriod period = periodOpt.get();
        byte[] bitmap = period.getBlockedDaysBitmap();
        
        // 특정 비트 해제 (0 = 활성화)
        int byteIndex = bitIndex / 8;
        int bitOffset = bitIndex % 8;
        bitmap[byteIndex] &= ~(1 << bitOffset);
        
        period.setBlockedDaysBitmap(bitmap);
        userBlockedPeriodRepository.save(period);
        
        log.debug("Unblocked date {} for user {} at bit index {}", date, userId, bitIndex);
    }

    /**
     * 특정 날짜가 비활성화되어 있는지 확인 (O(1))
     */
    @Transactional(readOnly = true)
    public boolean isDateBlocked(UUID userId, LocalDate date) {
        LocalDate periodStart = getCurrentPeriodStart();
        int bitIndex = dateToBitIndex(date, periodStart);
        
        if (bitIndex < 0 || bitIndex >= PERIOD_DAYS) {
            return false; // 범위 밖은 활성화로 간주
        }
        
        Optional<UserBlockedPeriod> periodOpt = userBlockedPeriodRepository
            .findByUserIdAndPeriodStart(userId, periodStart);
            
        if (periodOpt.isEmpty()) {
            return false; // 블록된 기간이 없으면 활성화
        }
        
        byte[] bitmap = periodOpt.get().getBlockedDaysBitmap();
        int byteIndex = bitIndex / 8;
        int bitOffset = bitIndex % 8;
        
        return (bitmap[byteIndex] & (1 << bitOffset)) != 0;
    }

    /**
     * 사용자의 모든 비활성화 날짜 조회 (O(90) = O(1))
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()")
    public Set<LocalDate> getUserBlockedDates(UUID userId) {
        LocalDate periodStart = getCurrentPeriodStart();
        
        Optional<UserBlockedPeriod> periodOpt = userBlockedPeriodRepository
            .findByUserIdAndPeriodStart(userId, periodStart);
            
        if (periodOpt.isEmpty()) {
            return Collections.emptySet();
        }
        
        Set<LocalDate> blockedDates = new HashSet<>();
        byte[] bitmap = periodOpt.get().getBlockedDaysBitmap();
        
        for (int i = 0; i < PERIOD_DAYS; i++) {
            int byteIndex = i / 8;
            int bitOffset = i % 8;
            
            if (byteIndex < bitmap.length && (bitmap[byteIndex] & (1 << bitOffset)) != 0) {
                blockedDates.add(periodStart.plusDays(i));
            }
        }
        
        log.debug("Found {} blocked dates for user {} in period {}", blockedDates.size(), userId, periodStart);
        return blockedDates;
    }

    /**
     * 사용자의 특정 기간 내 비활성화 날짜 조회
     */
    @Transactional(readOnly = true)
    public Set<LocalDate> getUserBlockedDatesInRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        log.debug("🔍 [QUERY_RANGE] Getting blocked dates for user={} from={} to={}", userId, startDate, endDate);
        
        Set<LocalDate> allBlockedDates = getUserBlockedDates(userId);
        
        Set<LocalDate> filteredDates = allBlockedDates.stream()
            .filter(date -> !date.isBefore(startDate) && !date.isAfter(endDate))
            .collect(HashSet::new, HashSet::add, HashSet::addAll);
            
        log.debug("🔍 [QUERY_RANGE] Found {} blocked dates (out of {} total) for user={} in range {} to {}", 
            filteredDates.size(), allBlockedDates.size(), userId, startDate, endDate);
            
        return filteredDates;
    }

    /**
     * 사용자의 모든 비활성화 정보 초기화
     */
    @CacheEvict(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()")
    public void clearAllBlockedDates(UUID userId) {
        LocalDate periodStart = getCurrentPeriodStart();
        userBlockedPeriodRepository.deleteByUserIdAndPeriodStart(userId, periodStart);
        log.info("Cleared all blocked dates for user {} in period {}", userId, periodStart);
    }

    /**
     * 현재 기간으로 마이그레이션 (월 경계 넘어갈 때 사용)
     */
    @Transactional
    @CacheEvict(value = CacheType.SCHEDULE_USER_BLOCKED_DATES, key = "#userId.toString()")
    public void migrateToCurrentPeriod(UUID userId) {
        LocalDate currentPeriodStart = getCurrentPeriodStart();
        LocalDate oldPeriodStart = currentPeriodStart.minusMonths(1);
        
        // 기존 데이터 조회
        Optional<UserBlockedPeriod> oldPeriod = userBlockedPeriodRepository
            .findByUserIdAndPeriodStart(userId, oldPeriodStart);
            
        if (oldPeriod.isEmpty()) {
            log.debug("No old period data found for user {} to migrate", userId);
            return; // 마이그레이션할 데이터 없음
        }
        
        // 현재 기간에 겹치는 날짜만 추출하여 새 기간에 복사
        Set<LocalDate> oldBlockedDates = extractBlockedDatesFromBitmap(oldPeriod.get());
        
        for (LocalDate blockedDate : oldBlockedDates) {
            if (!blockedDate.isBefore(currentPeriodStart) && 
                blockedDate.isBefore(currentPeriodStart.plusDays(PERIOD_DAYS))) {
                // 겹치는 날짜만 새 기간에 복사
                blockDate(userId, blockedDate);
            }
        }
        
        // 구 데이터 삭제
        userBlockedPeriodRepository.delete(oldPeriod.get());
        log.info("Migrated blocked dates for user {} from {} to {}", userId, oldPeriodStart, currentPeriodStart);
    }

    /**
     * 비트맵에서 실제 날짜 목록 추출
     */
    private Set<LocalDate> extractBlockedDatesFromBitmap(UserBlockedPeriod period) {
        Set<LocalDate> blockedDates = new HashSet<>();
        byte[] bitmap = period.getBlockedDaysBitmap();
        LocalDate periodStart = period.getPeriodStart();
        
        for (int i = 0; i < PERIOD_DAYS; i++) {
            int byteIndex = i / 8;
            int bitOffset = i % 8;
            
            if (byteIndex < bitmap.length && (bitmap[byteIndex] & (1 << bitOffset)) != 0) {
                blockedDates.add(periodStart.plusDays(i));
            }
        }
        
        return blockedDates;
    }

    /**
     * 통계 정보 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBlockedDateStatistics(UUID userId) {
        Set<LocalDate> blockedDates = getUserBlockedDates(userId);
        LocalDate periodStart = getCurrentPeriodStart();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("userId", userId);
        stats.put("currentPeriod", periodStart);
        stats.put("totalBlockedDays", blockedDates.size());
        stats.put("availableDays", PERIOD_DAYS - blockedDates.size());
        stats.put("blockingRatio", blockedDates.size() / (double) PERIOD_DAYS);
        stats.put("periodEndDate", periodStart.plusDays(PERIOD_DAYS - 1));
        
        return stats;
    }
}