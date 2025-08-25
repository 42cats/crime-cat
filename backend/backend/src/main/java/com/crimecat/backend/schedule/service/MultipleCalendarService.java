package com.crimecat.backend.schedule.service;

import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Summary;
import net.fortuna.ical4j.model.property.DtStart;
import net.fortuna.ical4j.model.property.DtEnd;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.StringReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 다중 iCalendar 관리 서비스
 * - 여러 캘린더 동기화
 * - 캘린더별 이벤트 그룹화
 * - 캘린더 이름 추출 및 색상 관리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MultipleCalendarService {

    private final UserCalendarRepository userCalendarRepository;
    private final CalendarColorManager colorManager;
    private final RestTemplate restTemplate;

    /**
     * 사용자의 모든 활성 캘린더 동기화
     */
    @Transactional
    public void syncAllUserCalendars(UUID userId) {
        List<UserCalendar> calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        
        log.info("Starting sync for {} calendars of user: {}", calendars.size(), userId);
        
        for (UserCalendar calendar : calendars) {
            try {
                syncSingleCalendar(calendar);
                calendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
                calendar.setLastSyncedAt(LocalDateTime.now());
                calendar.setSyncErrorMessage(null);
                log.debug("Successfully synced calendar: {}", calendar.getId());
            } catch (Exception e) {
                calendar.setSyncStatus(UserCalendar.SyncStatus.ERROR);
                calendar.setSyncErrorMessage(e.getMessage());
                log.error("Failed to sync calendar: {}", calendar.getId(), e);
            }
        }
        
        userCalendarRepository.saveAll(calendars);
    }

    /**
     * 단일 캘린더 동기화 및 메타데이터 추출
     */
    private void syncSingleCalendar(UserCalendar userCalendar) {
        try {
            // iCal 데이터 가져오기
            String icalData = restTemplate.getForObject(userCalendar.getIcalUrl(), String.class);
            if (icalData == null || icalData.trim().isEmpty()) {
                throw new RuntimeException("Empty iCal data received");
            }

            // iCal 파싱
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalData));

            // 캘린더 이름 추출 및 업데이트
            String calendarName = extractCalendarName(calendar);
            if (calendarName != null && !calendarName.equals(userCalendar.getCalendarName())) {
                userCalendar.setCalendarName(calendarName);
                
                // displayName이 없으면 calendarName으로 설정
                if (userCalendar.getDisplayName() == null || userCalendar.getDisplayName().trim().isEmpty()) {
                    userCalendar.setDisplayName(calendarName);
                }
            }

        } catch (Exception e) {
            log.error("Failed to sync calendar {}: {}", userCalendar.getId(), e.getMessage());
            throw new RuntimeException("Calendar sync failed: " + e.getMessage(), e);
        }
    }

    /**
     * iCalendar에서 캘린더 이름 추출
     * 우선순위: X-WR-CALNAME > PRODID > URL 기반 추측
     */
    private String extractCalendarName(Calendar calendar) {
        try {
            // 1순위: X-WR-CALNAME (가장 일반적)
            Property calName = calendar.getProperty("X-WR-CALNAME");
            if (calName != null && !calName.getValue().trim().isEmpty()) {
                return calName.getValue().trim();
            }

            // 2순위: PRODID에서 추출
            Property prodId = calendar.getProperty(Property.PRODID);
            if (prodId != null) {
                String prodIdValue = prodId.getValue();
                if (prodIdValue.contains("Google")) {
                    return "Google Calendar";
                } else if (prodIdValue.contains("Apple")) {
                    return "Apple Calendar";
                } else if (prodIdValue.contains("Outlook") || prodIdValue.contains("Microsoft")) {
                    return "Outlook Calendar";
                }
            }

            // 3순위: 기본값
            return "개인 캘린더";

        } catch (Exception e) {
            log.warn("Failed to extract calendar name, using default", e);
            return "개인 캘린더";
        }
    }

    /**
     * 새 캘린더 추가
     */
    @Transactional
    public UserCalendar addCalendar(UUID userId, String icalUrl, String displayName) {
        // 중복 URL 체크
        if (userCalendarRepository.existsByUserIdAndIcalUrl(userId, icalUrl)) {
            throw new IllegalArgumentException("이미 등록된 캘린더 URL입니다.");
        }

        // 다음 사용 가능한 색상 인덱스 할당
        int colorIndex = colorManager.getNextAvailableColorIndex(userId);
        int sortOrder = userCalendarRepository.countByUserId(userId);

        UserCalendar newCalendar = UserCalendar.builder()
                .user(null) // User 객체는 Controller에서 설정
                .icalUrl(icalUrl)
                .displayName(displayName)
                .colorIndex(colorIndex)
                .sortOrder(sortOrder)
                .isActive(true)
                .syncStatus(UserCalendar.SyncStatus.PENDING)
                .build();

        UserCalendar savedCalendar = userCalendarRepository.save(newCalendar);

        // 초기 동기화 시도
        try {
            syncSingleCalendar(savedCalendar);
            savedCalendar.setSyncStatus(UserCalendar.SyncStatus.SUCCESS);
            savedCalendar.setLastSyncedAt(LocalDateTime.now());
            log.info("Successfully added and synced new calendar: {}", savedCalendar.getId());
        } catch (Exception e) {
            savedCalendar.setSyncStatus(UserCalendar.SyncStatus.ERROR);
            savedCalendar.setSyncErrorMessage(e.getMessage());
            log.error("Failed initial sync for new calendar: {}", savedCalendar.getId(), e);
        }

        return userCalendarRepository.save(savedCalendar);
    }

    /**
     * 캘린더별 그룹화된 이벤트 정보 반환
     */
    public Map<String, CalendarGroup> getGroupedCalendarEvents(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<UserCalendar> calendars = userCalendarRepository.findByUserIdAndIsActiveOrderBySortOrder(userId, true);
        Map<String, CalendarGroup> groups = new LinkedHashMap<>();

        for (UserCalendar calendar : calendars) {
            try {
                List<CalendarEvent> events = fetchEventsFromCalendar(calendar, startDate, endDate);
                
                CalendarGroup group = CalendarGroup.builder()
                        .calendarId(calendar.getId())
                        .displayName(calendar.getDisplayName() != null ? calendar.getDisplayName() : "개인 캘린더")
                        .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                        .colorIndex(calendar.getColorIndex())
                        .events(events)
                        .lastSynced(calendar.getLastSyncedAt())
                        .syncStatus(calendar.getSyncStatus())
                        .build();

                groups.put(calendar.getId().toString(), group);
                
            } catch (Exception e) {
                log.error("Failed to fetch events from calendar: {}", calendar.getId(), e);
                
                // 오류가 발생한 캘린더도 빈 그룹으로 추가
                CalendarGroup errorGroup = CalendarGroup.builder()
                        .calendarId(calendar.getId())
                        .displayName(calendar.getDisplayName() != null ? calendar.getDisplayName() : "개인 캘린더")
                        .colorHex(colorManager.getColorByIndex(calendar.getColorIndex()))
                        .colorIndex(calendar.getColorIndex())
                        .events(Collections.emptyList())
                        .lastSynced(calendar.getLastSyncedAt())
                        .syncStatus(UserCalendar.SyncStatus.ERROR)
                        .syncError(e.getMessage())
                        .build();

                groups.put(calendar.getId().toString(), errorGroup);
            }
        }

        return groups;
    }

    /**
     * 특정 캘린더에서 이벤트 데이터 추출
     */
    private List<CalendarEvent> fetchEventsFromCalendar(UserCalendar userCalendar, LocalDate startDate, LocalDate endDate) {
        try {
            String icalData = restTemplate.getForObject(userCalendar.getIcalUrl(), String.class);
            if (icalData == null) return Collections.emptyList();

            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalData));

            return calendar.getComponents(Component.VEVENT).stream()
                    .map(component -> (VEvent) component)
                    .map(event -> convertToCalendarEvent(event, userCalendar))
                    .filter(Objects::nonNull)
                    .filter(event -> isEventInDateRange(event, startDate, endDate))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch events from calendar: {}", userCalendar.getId(), e);
            return Collections.emptyList();
        }
    }

    /**
     * VEvent를 CalendarEvent로 변환
     */
    private CalendarEvent convertToCalendarEvent(VEvent vEvent, UserCalendar userCalendar) {
        try {
            Summary summary = vEvent.getSummary();
            DtStart dtStart = vEvent.getStartDate();
            DtEnd dtEnd = vEvent.getEndDate();

            if (summary == null || dtStart == null) {
                return null;
            }

            return CalendarEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .title(summary.getValue())
                    .startTime(dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                    .endTime(dtEnd != null ? dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null)
                    .allDay(dtStart.isUtc()) // 간단한 전일 이벤트 판별
                    .source("icalendar")
                    .calendarId(userCalendar.getId().toString())
                    .calendarName(userCalendar.getDisplayName())
                    .colorHex(colorManager.getColorByIndex(userCalendar.getColorIndex()))
                    .build();

        } catch (Exception e) {
            log.warn("Failed to convert VEvent to CalendarEvent", e);
            return null;
        }
    }

    /**
     * 이벤트가 날짜 범위 내에 있는지 확인
     */
    private boolean isEventInDateRange(CalendarEvent event, LocalDate startDate, LocalDate endDate) {
        LocalDate eventStartDate = event.getStartTime().toLocalDate();
        return !eventStartDate.isBefore(startDate) && !eventStartDate.isAfter(endDate);
    }

    /**
     * 캘린더 그룹 DTO
     */
    @lombok.Builder
    @lombok.Getter
    public static class CalendarGroup {
        private UUID calendarId;
        private String displayName;
        private String colorHex;
        private Integer colorIndex;
        private List<CalendarEvent> events;
        private LocalDateTime lastSynced;
        private UserCalendar.SyncStatus syncStatus;
        private String syncError;
    }

    /**
     * 캘린더 이벤트 DTO
     */
    @lombok.Builder
    @lombok.Getter
    public static class CalendarEvent {
        private String id;
        private String title;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean allDay;
        private String source;
        private String calendarId;
        private String calendarName;
        private String colorHex;
    }
}