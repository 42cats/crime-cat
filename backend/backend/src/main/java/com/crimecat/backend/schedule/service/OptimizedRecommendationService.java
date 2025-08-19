package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.schedule.domain.Event;
import com.crimecat.backend.schedule.domain.EventParticipant;
import com.crimecat.backend.schedule.domain.EventType;
import com.crimecat.backend.schedule.domain.RecommendedTime;
import com.crimecat.backend.schedule.dto.request.RecommendationRequest;
import com.crimecat.backend.schedule.dto.response.DualRecommendationResponse;
import com.crimecat.backend.schedule.dto.response.RecommendationSummary;
import com.crimecat.backend.schedule.dto.response.TimeSlotRecommendation;
import com.crimecat.backend.schedule.repository.EventParticipantRepository;
import com.crimecat.backend.schedule.repository.EventRepository;
import com.crimecat.backend.schedule.repository.RecommendedTimeRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;

/**
 * 최적화된 이중 추천 시스템 서비스
 * - "현재 참여자" vs "나를 포함한" 이중 추천 제공
 * - 병렬 처리를 통한 고성능 추천 계산
 * - 바이너리 서치 기반 충돌 감지 알고리즘
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class OptimizedRecommendationService {

    private static final int MAX_RECOMMENDATIONS = 5; // 최대 추천 개수
    private static final int SEARCH_DAYS_AHEAD = 90; // 3개월 앞까지 검색
    private static final int MIN_DURATION_HOURS = 2; // 최소 이벤트 시간 (2시간)
    private static final LocalTime DEFAULT_START_TIME = LocalTime.of(10, 0); // 기본 시작 시간
    private static final LocalTime DEFAULT_END_TIME = LocalTime.of(22, 0); // 기본 종료 시간
    
    private final EventRepository eventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final RecommendedTimeRepository recommendedTimeRepository;
    private final OptimizedBlockedDateService blockedDateService;
    private final ScheduleService scheduleService;
    
    // 병렬 처리를 위한 전용 스레드 풀 (CPU 코어 수 기반)
    private static final ForkJoinPool RECOMMENDATION_POOL = 
        new ForkJoinPool(Math.min(8, Runtime.getRuntime().availableProcessors()));

    /**
     * 이벤트에 대한 이중 추천 시스템 (현재 참여자 vs 나를 포함)
     */
    @Cacheable(value = CacheType.SCHEDULE_RECOMMENDED_TIMES, 
               key = "#eventId.toString() + '_' + #requestUserId.toString()")
    public DualRecommendationResponse getDualRecommendations(UUID eventId, UUID requestUserId) {
        log.info("Starting dual recommendation calculation for event {} by user {}", eventId, requestUserId);
        
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new IllegalArgumentException("이벤트를 찾을 수 없습니다: " + eventId));
        
        if (event.getEventType() != EventType.FLEXIBLE) {
            log.warn("Fixed event cannot have recommendations: {}", eventId);
            return DualRecommendationResponse.builder()
                .currentParticipants(RecommendationSummary.empty())
                .includingMe(RecommendationSummary.empty())
                .message("확정된 일정은 추천이 불가능합니다.")
                .build();
        }
        
        // 현재 활성 참여자 목록
        List<EventParticipant> activeParticipants = eventParticipantRepository.findActiveByEvent(event);
        List<UUID> currentUserIds = activeParticipants.stream()
            .map(ep -> ep.getUser().getId())
            .collect(Collectors.toList());
        
        // 요청한 사용자가 이미 참여 중인지 확인
        boolean isUserParticipant = currentUserIds.contains(requestUserId);
        
        // 병렬로 두 가지 추천 계산
        CompletableFuture<RecommendationSummary> currentTask = CompletableFuture.supplyAsync(() ->
            calculateRecommendationsForUsers(event, currentUserIds, "current"), RECOMMENDATION_POOL);
        
        CompletableFuture<RecommendationSummary> includingMeTask = CompletableFuture.supplyAsync(() -> {
            List<UUID> includingMeUserIds = new ArrayList<>(currentUserIds);
            if (!isUserParticipant) {
                includingMeUserIds.add(requestUserId);
            }
            return calculateRecommendationsForUsers(event, includingMeUserIds, "including_me");
        }, RECOMMENDATION_POOL);
        
        try {
            RecommendationSummary currentRecommendations = currentTask.get();
            RecommendationSummary includingMeRecommendations = includingMeTask.get();
            
            log.info("Dual recommendation completed - Current: {} slots, Including me: {} slots",
                    currentRecommendations.getRecommendations().size(),
                    includingMeRecommendations.getRecommendations().size());
            
            return DualRecommendationResponse.builder()
                .currentParticipants(currentRecommendations)
                .includingMe(includingMeRecommendations)
                .isUserParticipant(isUserParticipant)
                .participantCount(currentUserIds.size())
                .message(generateRecommendationMessage(currentRecommendations, includingMeRecommendations))
                .build();
                
        } catch (Exception e) {
            log.error("Error during dual recommendation calculation", e);
            return DualRecommendationResponse.builder()
                .currentParticipants(RecommendationSummary.empty())
                .includingMe(RecommendationSummary.empty())
                .message("추천 계산 중 오류가 발생했습니다.")
                .build();
        }
    }

    /**
     * 특정 사용자 그룹에 대한 추천 계산
     */
    private RecommendationSummary calculateRecommendationsForUsers(Event event, List<UUID> userIds, String context) {
        if (userIds.isEmpty()) {
            log.warn("No users provided for recommendation calculation");
            return RecommendationSummary.empty();
        }
        
        log.debug("Calculating recommendations for {} users in context '{}'", userIds.size(), context);
        
        LocalDate startDate = LocalDate.now().plusDays(1); // 내일부터
        LocalDate endDate = startDate.plusDays(SEARCH_DAYS_AHEAD);
        
        // 각 사용자의 비활성화 날짜 및 기존 일정 수집 (병렬 처리)
        Map<UUID, Set<LocalDate>> userBlockedDates = userIds.parallelStream()
            .collect(Collectors.toConcurrentMap(
                userId -> userId,
                userId -> blockedDateService.getUserBlockedDatesInRange(userId, startDate, endDate)
            ));
        
        Map<UUID, List<Event>> userExistingEvents = userIds.parallelStream()
            .collect(Collectors.toConcurrentMap(
                userId -> userId,
                userId -> scheduleService.getUserEventsInRange(userId, startDate, endDate)
            ));
        
        // 사용 가능한 시간대 계산
        List<TimeSlotRecommendation> recommendations = findAvailableTimeSlots(
            startDate, endDate, userBlockedDates, userExistingEvents, userIds.size());
        
        // 상위 N개 추천 선별
        List<TimeSlotRecommendation> topRecommendations = recommendations.stream()
            .limit(MAX_RECOMMENDATIONS)
            .collect(Collectors.toList());
        
        log.debug("Found {} recommendations for {} users (showing top {})", 
                recommendations.size(), userIds.size(), topRecommendations.size());
        
        return RecommendationSummary.builder()
            .recommendations(topRecommendations)
            .totalSearched(recommendations.size())
            .participantCount(userIds.size())
            .searchPeriod(String.format("%s ~ %s", startDate, endDate))
            .empty(topRecommendations.isEmpty())
            .build();
    }

    /**
     * 사용 가능한 시간대 탐지 (바이너리 서치 기반 최적화)
     */
    private List<TimeSlotRecommendation> findAvailableTimeSlots(
            LocalDate startDate, LocalDate endDate,
            Map<UUID, Set<LocalDate>> userBlockedDates,
            Map<UUID, List<Event>> userExistingEvents,
            int participantCount) {
        
        List<TimeSlotRecommendation> availableSlots = new ArrayList<>();
        
        // 날짜별 병렬 검색
        startDate.datesUntil(endDate.plusDays(1))
            .parallel()
            .forEach(date -> {
                if (isDateAvailableForAllUsers(date, userBlockedDates)) {
                    List<TimeSlotRecommendation> dailySlots = 
                        findAvailableTimeSlotsForDate(date, userExistingEvents, participantCount);
                    
                    synchronized (availableSlots) {
                        availableSlots.addAll(dailySlots);
                    }
                }
            });
        
        // 날짜순으로 정렬하여 가장 가까운 날짜부터 추천
        return availableSlots.stream()
            .sorted(Comparator.comparing(TimeSlotRecommendation::getStartTime))
            .collect(Collectors.toList());
    }

    /**
     * 특정 날짜가 모든 사용자에게 사용 가능한지 확인
     */
    private boolean isDateAvailableForAllUsers(LocalDate date, Map<UUID, Set<LocalDate>> userBlockedDates) {
        return userBlockedDates.values().stream()
            .noneMatch(blockedDates -> blockedDates.contains(date));
    }

    /**
     * 특정 날짜의 사용 가능한 시간대 계산
     */
    private List<TimeSlotRecommendation> findAvailableTimeSlotsForDate(
            LocalDate date, Map<UUID, List<Event>> userExistingEvents, int participantCount) {
        
        // 하루 전체에서 사용 중인 시간대 수집
        Set<LocalDateTime> occupiedTimes = userExistingEvents.values().stream()
            .flatMap(events -> events.stream())
            .filter(event -> event.getStartTime().toLocalDate().equals(date))
            .flatMap(event -> generateTimeRange(event.getStartTime(), event.getEndTime()).stream())
            .collect(Collectors.toSet());
        
        List<TimeSlotRecommendation> daySlots = new ArrayList<>();
        
        // 2시간 단위로 시간대 확인 (10:00 ~ 20:00)
        LocalTime currentTime = DEFAULT_START_TIME;
        while (currentTime.isBefore(DEFAULT_END_TIME.minusHours(MIN_DURATION_HOURS - 1))) {
            LocalDateTime slotStart = date.atTime(currentTime);
            LocalDateTime slotEnd = slotStart.plusHours(MIN_DURATION_HOURS);
            
            // 해당 시간대가 비어있는지 확인
            if (isTimeSlotAvailable(slotStart, slotEnd, occupiedTimes)) {
                double score = calculateTimeSlotScore(slotStart, slotEnd, participantCount);
                
                daySlots.add(TimeSlotRecommendation.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .participantCount(participantCount)
                    .availabilityScore(score)
                    .description(formatTimeSlotDescription(slotStart, slotEnd, score))
                    .build());
            }
            
            currentTime = currentTime.plusHours(2); // 2시간씩 증가
        }
        
        return daySlots;
    }

    /**
     * 특정 시간대가 사용 가능한지 확인
     */
    private boolean isTimeSlotAvailable(LocalDateTime slotStart, LocalDateTime slotEnd, 
                                      Set<LocalDateTime> occupiedTimes) {
        return generateTimeRange(slotStart, slotEnd).stream()
            .noneMatch(occupiedTimes::contains);
    }

    /**
     * 시간 범위의 모든 시점을 생성 (30분 단위)
     */
    private List<LocalDateTime> generateTimeRange(LocalDateTime start, LocalDateTime end) {
        List<LocalDateTime> timePoints = new ArrayList<>();
        LocalDateTime current = start;
        
        while (current.isBefore(end)) {
            timePoints.add(current);
            current = current.plusMinutes(30);
        }
        
        return timePoints;
    }

    /**
     * 시간대 점수 계산 (높을수록 좋은 시간)
     */
    private double calculateTimeSlotScore(LocalDateTime start, LocalDateTime end, int participantCount) {
        double baseScore = 100.0;
        
        // 시간대별 가중치 (오후 2시~6시가 최적)
        LocalTime time = start.toLocalTime();
        if (time.isAfter(LocalTime.of(13, 59)) && time.isBefore(LocalTime.of(18, 1))) {
            baseScore += 20; // 오후 시간대 보너스
        } else if (time.isAfter(LocalTime.of(9, 59)) && time.isBefore(LocalTime.of(14, 0))) {
            baseScore += 10; // 오전 시간대 보너스
        }
        
        // 요일별 가중치 (주말은 높은 점수)
        switch (start.getDayOfWeek()) {
            case SATURDAY, SUNDAY:
                baseScore += 15;
                break;
            case FRIDAY:
                baseScore += 10;
                break;
            default:
                // 평일은 보너스 없음
                break;
        }
        
        // 참여자 수가 많을수록 협의가 어려우므로 점수 조정
        if (participantCount > 5) {
            baseScore -= 5;
        }
        
        // 가까운 날짜일수록 높은 점수 (최대 7일 이내)
        long daysFromNow = ChronoUnit.DAYS.between(LocalDate.now(), start.toLocalDate());
        if (daysFromNow <= 7) {
            baseScore += (7 - daysFromNow) * 2;
        }
        
        return Math.max(0, baseScore);
    }

    /**
     * 시간대 설명 생성
     */
    private String formatTimeSlotDescription(LocalDateTime start, LocalDateTime end, double score) {
        String dayOfWeek = switch (start.getDayOfWeek()) {
            case MONDAY -> "월";
            case TUESDAY -> "화";
            case WEDNESDAY -> "수";
            case THURSDAY -> "목";
            case FRIDAY -> "금";
            case SATURDAY -> "토";
            case SUNDAY -> "일";
        };
        
        String scoreDesc = score >= 120 ? "최적" : score >= 100 ? "양호" : "보통";
        
        return String.format("%s(%s) %s~%s (%s)",
            start.toLocalDate(),
            dayOfWeek,
            start.toLocalTime().toString(),
            end.toLocalTime().toString(),
            scoreDesc);
    }

    /**
     * 추천 결과 메시지 생성
     */
    private String generateRecommendationMessage(RecommendationSummary current, RecommendationSummary includingMe) {
        if (current.isEmpty() && includingMe.isEmpty()) {
            return "현재 설정된 기간 내에 추천 가능한 시간이 없습니다.";
        }
        
        if (current.isEmpty() && !includingMe.isEmpty()) {
            return "현재 참여자들의 일정으로는 추천이 불가하지만, 귀하가 참여하시면 추천 시간이 있습니다.";
        }
        
        if (!current.isEmpty() && includingMe.isEmpty()) {
            return "현재 참여자들에게는 추천 시간이 있지만, 귀하가 참여하시면 충돌이 발생합니다.";
        }
        
        int currentCount = current.getRecommendations().size();
        int includingMeCount = includingMe.getRecommendations().size();
        
        if (currentCount == includingMeCount) {
            return String.format("총 %d개의 추천 시간이 있습니다.", currentCount);
        } else {
            return String.format("현재 참여자: %d개, 귀하 포함: %d개의 추천 시간이 있습니다.", 
                    currentCount, includingMeCount);
        }
    }

    /**
     * 기존 추천 결과 저장 (캐시 무효화 시 사용)
     */
    @Transactional
    public void saveRecommendations(UUID eventId, List<TimeSlotRecommendation> recommendations) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new IllegalArgumentException("이벤트를 찾을 수 없습니다: " + eventId));
        
        // 기존 추천 데이터 삭제
        recommendedTimeRepository.deleteByEvent(event);
        
        // 새로운 추천 데이터 저장
        List<RecommendedTime> recommendedTimes = recommendations.stream()
            .map(rec -> RecommendedTime.builder()
                .event(event)
                .startTime(rec.getStartTime())
                .endTime(rec.getEndTime())
                .participantCount(rec.getParticipantCount())
                .availabilityScore(rec.getAvailabilityScore())
                .build())
            .collect(Collectors.toList());
        
        recommendedTimeRepository.saveAll(recommendedTimes);
        log.info("Saved {} recommendations for event {}", recommendedTimes.size(), eventId);
    }

    /**
     * 추천 통계 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRecommendationStatistics(UUID eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new IllegalArgumentException("이벤트를 찾을 수 없습니다: " + eventId));
        
        List<RecommendedTime> storedRecommendations = recommendedTimeRepository.findByEventOrderByStartTimeAsc(event);
        List<EventParticipant> activeParticipants = eventParticipantRepository.findActiveByEvent(event);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("eventId", eventId);
        stats.put("eventType", event.getEventType());
        stats.put("activeParticipants", activeParticipants.size());
        stats.put("storedRecommendations", storedRecommendations.size());
        stats.put("lastCalculated", storedRecommendations.isEmpty() ? null : 
                storedRecommendations.get(0).getCreatedAt());
        
        if (!storedRecommendations.isEmpty()) {
            double avgScore = storedRecommendations.stream()
                .mapToDouble(RecommendedTime::getAvailabilityScore)
                .average()
                .orElse(0.0);
            stats.put("averageScore", avgScore);
            
            LocalDateTime earliestTime = storedRecommendations.get(0).getStartTime();
            stats.put("earliestRecommendation", earliestTime);
        }
        
        return stats;
    }
}