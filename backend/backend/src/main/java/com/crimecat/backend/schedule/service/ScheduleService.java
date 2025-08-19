package com.crimecat.backend.schedule.service;

import com.crimecat.backend.config.CacheType;
import com.crimecat.backend.schedule.domain.*;
import com.crimecat.backend.schedule.dto.EventCreateRequest;
import com.crimecat.backend.schedule.dto.EventResponse;
import com.crimecat.backend.schedule.dto.UserCalendarRequest;
import com.crimecat.backend.schedule.repository.EventParticipantRepository;
import com.crimecat.backend.schedule.repository.EventRepository;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleService {

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
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        if (event.getStatus() != EventStatus.RECRUITING) {
            throw new IllegalStateException("This event is not recruiting participants.");
        }

        // Check if user already joined
        if (eventParticipantRepository.existsByEventAndUser(event, currentUser)) {
            throw new IllegalStateException("You have already joined this event.");
        }

        // Check participant limit
        int currentParticipants = eventParticipantRepository.countByEvent(event);
        if (event.getMaxParticipants() != null && currentParticipants >= event.getMaxParticipants()) {
            throw new IllegalStateException("The event is full.");
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
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
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

    // Helper method to fetch and parse iCal data
    @Cacheable(value = CacheType.SCHEDULE_ICAL_PARSED, key = "#icalUrl.hashCode()")
    private List<LocalDateTime[]> fetchAndParseIcal(String icalUrl) {
        WebClient webClient = webClientBuilder.build();
        String icalContent = webClient.get().uri(icalUrl).retrieve().bodyToMono(String.class).block();

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
            // Log error with proper logging framework
            // TODO: Replace with proper logger
            System.err.println("Failed to parse iCalendar from URL: " + icalUrl + " - " + e.getMessage());
            // Return empty list to gracefully handle parsing failures
        }
        return busyTimes;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_AVAILABILITY, key = "#eventId.toString()")
    public List<LocalDateTime[]> calculateAvailability(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

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
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        return eventParticipantRepository.findByEvent(event);
    }

    /**
     * 캐시 가능한 참여자 수 조회 메서드
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheType.SCHEDULE_PARTICIPANTS, key = "#eventId.toString() + ':count'")
    public int getEventParticipantCount(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        return eventParticipantRepository.countByEvent(event);
    }
}
