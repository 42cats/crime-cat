package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.schedule.domain.*;
import com.crimecat.backend.schedule.dto.EventCreateRequest;
import com.crimecat.backend.schedule.dto.EventResponse;
import com.crimecat.backend.schedule.dto.PublicEventResponse;
import com.crimecat.backend.schedule.dto.UserCalendarRequest;
import com.crimecat.backend.schedule.repository.EventParticipantRepository;
import com.crimecat.backend.schedule.repository.EventRepository;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.DtEnd;
import net.fortuna.ical4j.model.property.DtStart;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.StringReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {
    
    private static final Logger log = LoggerFactory.getLogger(ScheduleService.class);

    private final EventRepository eventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final UserCalendarRepository userCalendarRepository;
    private final WebClient.Builder webClientBuilder;
    // private final NotificationService notificationService; // Assuming notification service exists

    @CacheEvict(value = CacheType.SCHEDULE_EVENT_LIST, allEntries = true)
    public Event createEvent(EventCreateRequest request, WebUser currentUser) {
        Event event = Event.builder()
                .creator(currentUser)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .maxParticipants(request.getMaxParticipants())
                .status(EventStatus.RECRUITING) // Initial status
                .build();
        return eventRepository.save(event);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_PARTICIPANTS, key = "#eventId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, key = "#eventId.toString()"),
        @CacheEvict(value = CacheType.SCHEDULE_EVENT_LIST, allEntries = true)
    })
    public void joinEvent(UUID eventId, WebUser currentUser) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());

        if (event.getStatus() != EventStatus.RECRUITING) {
            throw ErrorStatus.EVENT_NOT_RECRUITING.asServiceException();
        }

        // Check if user already joined
        if (eventParticipantRepository.existsByEventAndUser(event, currentUser)) {
            throw ErrorStatus.EVENT_ALREADY_JOINED.asServiceException();
        }

        // Check participant limit
        int currentParticipants = eventParticipantRepository.countByEvent(event);
        if (event.getMaxParticipants() != null && currentParticipants >= event.getMaxParticipants()) {
            throw ErrorStatus.EVENT_FULL.asServiceException();
        }

        EventParticipant participant = EventParticipant.builder()
                .event(event)
                .user(currentUser)
                .status("PENDING") // Initial participant status
                .build();
        eventParticipantRepository.save(participant);

        // TODO: Trigger notification to the event creator
        // notificationService.send(event.getCreator(), currentUser.getNickname() + " has joined your event: " + event.getTitle());

        // Check if the event is now full and update status (after adding the new participant)
        if (event.getMaxParticipants() != null && (currentParticipants + 1) >= event.getMaxParticipants()) {
            event.setStatus(EventStatus.RECRUITMENT_COMPLETE);
            eventRepository.save(event);
        }
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_EVENT_LIST, 
               key = "(#category != null ? #category : 'ALL') + ':' + (#status != null ? #status.name() : 'ALL')")
    public List<EventResponse> getEvents(String category, EventStatus status) {
        List<Event> events;
        if (category != null && status != null) {
            events = eventRepository.findByCategoryAndStatus(category, status);
        } else if (category != null) {
            events = eventRepository.findByCategory(category);
        } else if (status != null) {
            events = eventRepository.findByStatus(status);
        } else {
            events = eventRepository.findAll();
        }

        return events.stream()
                .map(EventResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_EVENT_DETAIL, key = "#eventId.toString()")
    public EventResponse getEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        return EventResponse.from(event);
    }

    @Caching(evict = {
        @CacheEvict(value = CacheType.SCHEDULE_ICAL_PARSED, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_AVAILABILITY, allEntries = true),
        @CacheEvict(value = CacheType.SCHEDULE_USER_CALENDAR, key = "#currentUser.id.toString()")
    })
    public void saveUserCalendar(UserCalendarRequest request, WebUser currentUser) {
        Optional<UserCalendar> existingCalendar = userCalendarRepository.findByUser(currentUser);

        UserCalendar calendar = existingCalendar.orElseGet(() -> UserCalendar.builder().user(currentUser).build());
        calendar.setIcalUrl(request.getIcalUrl());

        userCalendarRepository.save(calendar);
    }

    // Helper method to fetch and parse iCal data with event details
    @Cacheable(value = CacheType.SCHEDULE_ICAL_PARSED, key = "#icalUrl.hashCode() + '_detailed'")
    private List<Map<String, Object>> fetchAndParseIcalWithDetails(String icalUrl) {
        log.info("🔍 [ICAL_DEBUG] Starting to fetch iCalendar from URL: {}", icalUrl);
        
        WebClient webClient = webClientBuilder.build();
        
        String icalContent;
        try {
            // Create URI directly to avoid double encoding issues
            java.net.URI uri = java.net.URI.create(icalUrl);
            log.debug("🔍 [ICAL_DEBUG] Created URI: {}", uri.toString());
            
            icalContent = webClient.get().uri(uri).retrieve().bodyToMono(String.class).block();
        } catch (Exception e) {
            log.error("🔍 [ICAL_DEBUG] Failed to fetch iCalendar from URL: {} - {}", icalUrl, e.getMessage(), e);
            return new ArrayList<>();
        }

        List<Map<String, Object>> events = new ArrayList<>();
        if (icalContent == null || icalContent.isEmpty()) {
            log.warn("🔍 [ICAL_DEBUG] iCalendar content is null or empty");
            return events;
        }
        
        log.info("🔍 [ICAL_DEBUG] iCalendar content length: {}", icalContent.length());
        log.debug("🔍 [ICAL_DEBUG] First 500 characters: {}", icalContent.substring(0, Math.min(500, icalContent.length())));

        try {
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalContent));

            log.info("🔍 [ICAL_DEBUG] Starting to parse VEVENT components");
            int eventCount = 0;
            int currentYearEvents = 0;
            
            for (Object component : calendar.getComponents(Component.VEVENT)) {
                VEvent event = (VEvent) component;
                DtStart dtStart = event.getStartDate();
                DtEnd dtEnd = event.getEndDate();
                eventCount++;

                if (dtStart != null && dtEnd != null) {
                    LocalDateTime start = dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    LocalDateTime end = dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    
                    // 현재 연도 이벤트인지 확인
                    if (start.getYear() == LocalDateTime.now().getYear()) {
                        currentYearEvents++;
                        log.info("🔍 [ICAL_DEBUG] Found {} event: {} on {}", 
                            LocalDateTime.now().getYear(),
                            event.getSummary() != null ? event.getSummary().getValue() : "No title",
                            start.toLocalDate());
                    }
                    
                    Map<String, Object> eventDetails = new HashMap<>();
                    eventDetails.put("startTime", start);
                    eventDetails.put("endTime", end);
                    eventDetails.put("title", event.getSummary() != null ? event.getSummary().getValue() : "개인 일정");
                    eventDetails.put("description", event.getDescription() != null ? event.getDescription().getValue() : null);
                    
                    events.add(eventDetails);
                    
                    // 처음 5개 이벤트의 상세 정보 로그
                    if (eventCount <= 5) {
                        log.debug("🔍 [ICAL_DEBUG] Event {}: title={}, start={}, end={}", 
                            eventCount,
                            event.getSummary() != null ? event.getSummary().getValue() : "No title",
                            start, end);
                    }
                }
            }
            
            log.info("🔍 [ICAL_DEBUG] Parsed {} total events, {} events in {}", 
                eventCount, currentYearEvents, LocalDateTime.now().getYear());
        } catch (Exception e) {
            log.error("Failed to parse iCalendar from URL: {} - {}", icalUrl, e.getMessage(), e);
            // Return empty list to gracefully handle parsing failures
        }
        return events;
    }

    // Helper method to fetch and parse iCal data (for backward compatibility)
    @Cacheable(value = CacheType.SCHEDULE_ICAL_PARSED, key = "#icalUrl.hashCode()")
    private List<LocalDateTime[]> fetchAndParseIcal(String icalUrl) {
        WebClient webClient = webClientBuilder.build();
        
        String icalContent;
        try {
            // Create URI directly to avoid double encoding issues
            java.net.URI uri = java.net.URI.create(icalUrl);
            icalContent = webClient.get().uri(uri).retrieve().bodyToMono(String.class).block();
        } catch (Exception e) {
            log.error("Failed to fetch iCalendar from URL: {} - {}", icalUrl, e.getMessage(), e);
            return new ArrayList<>();
        }

        List<LocalDateTime[]> busyTimes = new ArrayList<>();
        if (icalContent == null || icalContent.isEmpty()) {
            return busyTimes;
        }

        try {
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalContent));

            for (Object component : calendar.getComponents(Component.VEVENT)) {
                VEvent event = (VEvent) component;
                DtStart dtStart = event.getStartDate();
                DtEnd dtEnd = event.getEndDate();

                if (dtStart != null && dtEnd != null) {
                    LocalDateTime start = dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    LocalDateTime end = dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                    busyTimes.add(new LocalDateTime[]{start, end});
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse iCalendar from URL: {} - {}", icalUrl, e.getMessage(), e);
            // Return empty list to gracefully handle parsing failures
        }
        return busyTimes;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_AVAILABILITY, key = "#eventId.toString()")
    public List<LocalDateTime[]> calculateAvailability(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());

        List<EventParticipant> participants = eventParticipantRepository.findByEvent(event);

        // Collect all busy times from participants
        List<LocalDateTime[]> allBusyTimes = new ArrayList<>();
        for (EventParticipant participant : participants) {
            userCalendarRepository.findByUser(participant.getUser()).ifPresent(userCalendar -> {
                allBusyTimes.addAll(fetchAndParseIcal(userCalendar.getIcalUrl()));
            });
        }

        // Sort all busy times by start time
        allBusyTimes.sort(Comparator.comparing(interval -> interval[0]));

        // Merge overlapping busy intervals
        List<LocalDateTime[]> mergedBusyTimes = new ArrayList<>();
        if (allBusyTimes.isEmpty()) {
            return new ArrayList<>(); // No busy times, so all times are free
        }

        LocalDateTime[] currentMerged = allBusyTimes.get(0);
        for (int i = 1; i < allBusyTimes.size(); i++) {
            LocalDateTime[] next = allBusyTimes.get(i);
            if (next[0].isBefore(currentMerged[1]) || next[0].isEqual(currentMerged[1])) {
                // Overlap, merge intervals
                currentMerged[1] = currentMerged[1].isAfter(next[1]) ? currentMerged[1] : next[1];
            } else {
                // No overlap, add current merged and start new one
                mergedBusyTimes.add(currentMerged);
                currentMerged = next;
            }
        }
        mergedBusyTimes.add(currentMerged); // Add the last merged interval

        // Determine a relevant time range for availability (e.g., next 30 days)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysLater = now.plusDays(30);

        List<LocalDateTime[]> freeTimes = new ArrayList<>();
        LocalDateTime currentFreeStart = now;

        for (LocalDateTime[] busyInterval : mergedBusyTimes) {
            if (currentFreeStart.isBefore(busyInterval[0])) {
                // There's a free slot before this busy interval
                freeTimes.add(new LocalDateTime[]{currentFreeStart, busyInterval[0]});
            }
            currentFreeStart = currentFreeStart.isAfter(busyInterval[1]) ? currentFreeStart : busyInterval[1];
        }

        // Add any remaining free time after the last busy interval up to thirtyDaysLater
        if (currentFreeStart.isBefore(thirtyDaysLater)) {
            freeTimes.add(new LocalDateTime[]{currentFreeStart, thirtyDaysLater});
        }

        return freeTimes;
    }

    /**
     * 캐시 가능한 참여자 목록 조회 메서드
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_PARTICIPANTS, key = "#eventId.toString()")
    public List<EventParticipant> getEventParticipants(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        return eventParticipantRepository.findByEvent(event);
    }

    /**
     * 캐시 가능한 참여자 수 조회 메서드
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_PARTICIPANTS, key = "#eventId.toString() + ':count'")
    public int getEventParticipantCount(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        return eventParticipantRepository.countByEvent(event);
    }

    /**
     * 퍼블릭 API용 일정 목록 조회
     * - 민감정보 제외한 공개 정보만 반환
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_EVENT_LIST, 
               key = "'public:' + (#category != null ? #category : 'ALL') + ':' + (#status != null ? #status.name() : 'ALL')")
    public List<PublicEventResponse> getPublicEvents(String category, EventStatus status) {
        List<Event> events;
        if (category != null && status != null) {
            events = eventRepository.findByCategoryAndStatus(category, status);
        } else if (category != null) {
            events = eventRepository.findByCategory(category);
        } else if (status != null) {
            events = eventRepository.findByStatus(status);
        } else {
            events = eventRepository.findAll();
        }

        return events.stream()
                .map(PublicEventResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 퍼블릭 API용 일정 상세 조회
     * - 민감정보 제외한 공개 정보만 반환
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_EVENT_DETAIL, key = "'public:' + #eventId.toString()")
    public PublicEventResponse getPublicEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
        return PublicEventResponse.from(event);
    }

    /**
     * 퍼블릭 API용 일정 가용시간 조회
     * - 개인 식별 정보 없이 가용시간만 제공
     * - 기존 calculateAvailability 메서드 재사용
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_AVAILABILITY, key = "'public:' + #eventId.toString()")
    public List<LocalDateTime[]> getPublicAvailability(UUID eventId) {
        // 기존 메서드 재사용 - 이미 개인 식별 정보 포함하지 않음
        return calculateAvailability(eventId);
    }

    /**
     * 퍼블릭 API용 참여자 수만 조회
     * - 개인 식별 정보 제외하고 참여자 수만 반환
     */
    @Transactional(readOnly = true)  
    @Cacheable(value = CacheType.SCHEDULE_PARTICIPANTS, key = "'public:' + #eventId.toString() + ':count'")
    public int getPublicParticipantCount(UUID eventId) {
        // 기존 메서드 재사용 - 개수만 반환하므로 안전
        return getEventParticipantCount(eventId);
    }

    /**
     * 특정 사용자의 특정 기간 내 Crime-Cat 이벤트 조회 (추천 시스템용)
     * - 시작 시간과 종료 시간이 있는 확정된 일정만 반환
     */
    @Transactional(readOnly = true)
    public List<Event> getUserCrimeCatEventsInRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        WebUser user = WebUser.builder().id(userId).build(); // 프록시 객체 생성
        
        // 사용자가 참여 중인 활성 이벤트 중에서 특정 기간 내에 있는 이벤트 조회
        List<EventParticipant> activeParticipants = eventParticipantRepository.findActiveByUser(user);
        
        return activeParticipants.stream()
            .map(EventParticipant::getEvent)
            .filter(event -> event.getStartTime() != null && event.getEndTime() != null) // 시간이 확정된 이벤트만
            .filter(event -> {
                LocalDate eventDate = event.getStartTime().toLocalDate();
                return !eventDate.isBefore(startDate) && !eventDate.isAfter(endDate);
            })
            .collect(Collectors.toList());
    }

    /**
     * 특정 사용자의 특정 기간 내 iCalendar 이벤트 조회 (캘린더 표시용)
     * - 외부 .ics 파일에서 파싱된 개인 일정 반환
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserEventsInRange(UUID userId, LocalDate startDate, LocalDate endDate) {
        WebUser user = WebUser.builder().id(userId).build();
        
        // 사용자의 iCalendar URL 조회
        Optional<UserCalendar> userCalendarOpt = userCalendarRepository.findByUser(user);
        if (userCalendarOpt.isEmpty() || userCalendarOpt.get().getIcalUrl() == null) {
            return Collections.emptyList();
        }
        
        String icalUrl = userCalendarOpt.get().getIcalUrl();
        
        try {
            // iCalendar 데이터 파싱 (상세 정보 포함)
            List<Map<String, Object>> icalEvents = fetchAndParseIcalWithDetails(icalUrl);
            
            // 지정된 날짜 범위 내의 이벤트만 필터링하고 API 응답 형태로 변환
            LocalDateTime rangeStart = startDate.atStartOfDay();
            LocalDateTime rangeEnd = endDate.atTime(23, 59, 59);
            
            log.info("🔍 [ICAL_FILTER] Filtering events for range: {} to {}", rangeStart, rangeEnd);
            log.info("🔍 [ICAL_FILTER] Total parsed events before filtering: {}", icalEvents.size());
            
            AtomicInteger filteredEventCount = new AtomicInteger(0);
            AtomicInteger outOfRangeCount = new AtomicInteger(0);
            
            List<Map<String, Object>> result = icalEvents.stream()
                .filter(eventDetails -> {
                    LocalDateTime eventStart = (LocalDateTime) eventDetails.get("startTime");
                    LocalDateTime eventEnd = (LocalDateTime) eventDetails.get("endTime");
                    
                    // 이벤트가 범위와 겹치는지 확인
                    boolean isInRange = eventStart.isBefore(rangeEnd) && eventEnd.isAfter(rangeStart);
                    
                    if (isInRange) {
                        int count = filteredEventCount.incrementAndGet();
                        log.debug("🔍 [ICAL_FILTER] Event {} in range: {} from {} to {}", 
                            count,
                            (eventDetails.get("title") != null ? eventDetails.get("title") : "No title"),
                            eventStart, eventEnd);
                    } else {
                        int count = outOfRangeCount.incrementAndGet();
                        if (count <= 3) { // 처음 3개만 로깅
                            log.debug("🔍 [ICAL_FILTER] Event out of range: {} from {} to {}", 
                                (eventDetails.get("title") != null ? eventDetails.get("title") : "No title"),
                                eventStart, eventEnd);
                        }
                    }
                    
                    return isInRange;
                })
                .map(eventDetails -> {
                    LocalDateTime startTime = (LocalDateTime) eventDetails.get("startTime");
                    LocalDateTime endTime = (LocalDateTime) eventDetails.get("endTime");
                    String title = (String) eventDetails.get("title");
                    
                    Map<String, Object> eventMap = new HashMap<>();
                    eventMap.put("id", "ical_" + startTime.toString().hashCode()); // 고유 ID 생성
                    eventMap.put("title", title != null ? title : "개인 일정");
                    eventMap.put("startTime", startTime.toString());
                    eventMap.put("endTime", endTime.toString());
                    eventMap.put("allDay", false);
                    eventMap.put("source", "icalendar"); // 이벤트 소스 구분
                    eventMap.put("category", "personal"); // 개인 일정 카테고리
                    return eventMap;
                })
                .collect(Collectors.toList());
                
            // 최종 필터링 결과 요약
            log.info("🔍 [ICAL_SUMMARY] Final filtering summary:");
            log.info("🔍 [ICAL_SUMMARY] - Events in range: {}", filteredEventCount.get());
            log.info("🔍 [ICAL_SUMMARY] - Events out of range: {}", outOfRangeCount.get());
            log.info("🔍 [ICAL_SUMMARY] - Total events processed: {}", (filteredEventCount.get() + outOfRangeCount.get()));
            
            return result;
                
        } catch (Exception e) {
            log.error("Failed to fetch iCalendar events for user {}: {}", userId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 이벤트 엔티티 조회 (컨트롤러에서 사용)
     */
    @Transactional(readOnly = true)
    public Event getEventEntity(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> ErrorStatus.EVENT_NOT_FOUND.asServiceException());
    }
}
