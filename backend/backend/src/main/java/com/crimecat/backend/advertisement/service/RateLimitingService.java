package com.crimecat.backend.advertisement.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 광고 신청 Rate Limiting 서비스
 * 동일 사용자의 과도한 요청을 방지합니다.
 */
@Slf4j
@Service
public class RateLimitingService {
    
    private static final int MAX_REQUESTS_PER_HOUR = 5; // 시간당 최대 요청 수
    private static final int MAX_REQUESTS_PER_DAY = 20; // 일당 최대 요청 수
    
    // 사용자별 요청 기록 저장 (실제 환경에서는 Redis 등 외부 저장소 사용 권장)
    private final ConcurrentHashMap<UUID, UserRequestHistory> requestHistories = new ConcurrentHashMap<>();
    
    /**
     * 사용자의 요청이 Rate Limit을 초과하는지 확인
     * @param userId 사용자 ID
     * @throws ServiceException Rate Limit 초과 시
     */
    public void checkRateLimit(UUID userId) {
        LocalDateTime now = LocalDateTime.now();
        UserRequestHistory history = requestHistories.computeIfAbsent(userId, k -> new UserRequestHistory());
        
        // 만료된 요청 기록 정리
        history.cleanExpiredRequests(now);
        
        // 시간당 제한 확인
        long requestsInLastHour = history.getRequestsInLastHour(now);
        if (requestsInLastHour >= MAX_REQUESTS_PER_HOUR) {
            log.warn("사용자 {} - 시간당 요청 제한 초과: {}/{}",
                userId, requestsInLastHour, MAX_REQUESTS_PER_HOUR);
            throw new ServiceException(ErrorStatus.TOO_MANY_REQUESTS);
        }
        
        // 일당 제한 확인
        long requestsInLastDay = history.getRequestsInLastDay(now);
        if (requestsInLastDay >= MAX_REQUESTS_PER_DAY) {
            log.warn("사용자 {} - 일일 요청 제한 초과: {}/{}",
                userId, requestsInLastDay, MAX_REQUESTS_PER_DAY);
            throw new ServiceException(ErrorStatus.TOO_MANY_REQUESTS);
        }
        
        // 요청 기록 추가
        history.addRequest(now);
        
        log.debug("Rate Limit 검증 통과: userId={}, 시간당요청={}/{}, 일일요청={}/{}",
            userId, requestsInLastHour + 1, MAX_REQUESTS_PER_HOUR, 
            requestsInLastDay + 1, MAX_REQUESTS_PER_DAY);
    }
    
    /**
     * 사용자별 요청 기록을 관리하는 내부 클래스
     */
    private static class UserRequestHistory {
        private final java.util.List<LocalDateTime> requests = new java.util.concurrent.CopyOnWriteArrayList<>();
        
        void addRequest(LocalDateTime requestTime) {
            requests.add(requestTime);
        }
        
        void cleanExpiredRequests(LocalDateTime now) {
            LocalDateTime oneDayAgo = now.minusDays(1);
            requests.removeIf(requestTime -> requestTime.isBefore(oneDayAgo));
        }
        
        long getRequestsInLastHour(LocalDateTime now) {
            LocalDateTime oneHourAgo = now.minusHours(1);
            return requests.stream()
                .filter(requestTime -> requestTime.isAfter(oneHourAgo))
                .count();
        }
        
        long getRequestsInLastDay(LocalDateTime now) {
            LocalDateTime oneDayAgo = now.minusDays(1);
            return requests.stream()
                .filter(requestTime -> requestTime.isAfter(oneDayAgo))
                .count();
        }
    }
}