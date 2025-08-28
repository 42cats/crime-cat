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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final ICalParsingService icalParsingService;
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

    // Delegate to ICalParsingService for parsing operations

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
                try {
                    // 새 ICalParsingService 메서드로 교체
                    Set<LocalDate> dates = icalParsingService.parseICalDates(userCalendar.getIcalUrl(), 3);
                    // LocalDate를 LocalDateTime 배열로 변환
                    for (LocalDate date : dates) {
                        allBusyTimes.add(new LocalDateTime[]{date.atStartOfDay(), date.atTime(23, 59)});
                    }
                } catch (Exception e) {
                    log.warn("iCal 파싱 실패: {}", userCalendar.getIcalUrl());
                }
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
            // 새 ICalParsingService 메서드 사용 - 날짜만 반환
            Set<LocalDate> dates = icalParsingService.parseICalDates(icalUrl, 3);
            
            // LocalDate를 Map<String, Object> 형태로 변환
            List<Map<String, Object>> result = dates.stream()
                .filter(date -> !date.isBefore(startDate) && !date.isAfter(endDate))
                .map(date -> {
                    Map<String, Object> event = new HashMap<>();
                    event.put("id", "ical_" + date.toString().hashCode());
                    event.put("title", "개인 일정");
                    event.put("startTime", date.atStartOfDay().toString());
                    event.put("endTime", date.atTime(23, 59).toString());
                    event.put("allDay", true);
                    event.put("source", "icalendar");
                    event.put("category", "personal");
                    return event;
                })
                .collect(Collectors.toList());
            
            log.info("🔍 [ICAL_FILTER] Filtered events: {} out of {} total dates", 
                    result.size(), dates.size());
            
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
