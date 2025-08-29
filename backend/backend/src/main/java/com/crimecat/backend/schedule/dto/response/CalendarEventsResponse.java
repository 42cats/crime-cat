package com.crimecat.backend.schedule.dto.response;

import com.crimecat.backend.schedule.service.MultipleCalendarService;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 통합 캘린더 이벤트 응답 DTO
 * - Discord 봇, 웹 API 공통 사용
 * - 캐싱 시스템 통합 응답 형식
 */
@Getter
@Builder
public class CalendarEventsResponse {
    
    private final UUID userId;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final LocalDateTime retrievedAt;
    
    // 캘린더별 그룹화된 이벤트 (웹 API용)
    private final Map<String, MultipleCalendarService.CalendarGroup> calendarGroups;
    
    // 통합 통계 정보
    private final CalendarStatistics statistics;
    
    // 원본 데이터 (변환 전)
    private final List<CalendarEvent> rawEvents;
    
    @Getter
    @Builder
    public static class CalendarStatistics {
        private final int totalCalendars;
        private final int successfulCalendars;
        private final int totalEvents;
        private final int failedCalendars;
        private final LocalDateTime lastSyncedAt;
        private final boolean hasErrors;
        private final List<String> errorMessages;
    }
    
    @Getter
    @Builder
    public static class CalendarEvent {
        private final String id;
        private final String title;
        private final LocalDateTime startTime;
        private final LocalDateTime endTime;
        private final boolean allDay;
        private final String source;
        private final String calendarId;
        private final String calendarName;
        private final String colorHex;
        private final LocalDate eventDate;  // 날짜별 그룹화용
    }
    
    /**
     * Discord 봇용 한국어 날짜 문자열 변환
     */
    public String toKoreanDateFormat() {
        if (rawEvents == null || rawEvents.isEmpty()) {
            return "등록된 일정이 없습니다";
        }
        
        return rawEvents.stream()
                .map(event -> event.getEventDate())
                .collect(java.util.stream.Collectors.toSet())
                .stream()
                .sorted()
                .collect(java.util.stream.Collectors.groupingBy(
                    date -> date.getYear() + "-" + String.format("%02d", date.getMonthValue()),
                    java.util.LinkedHashMap::new,
                    java.util.stream.Collectors.mapping(
                        LocalDate::getDayOfMonth,
                        java.util.stream.Collectors.toList()
                    )
                ))
                .entrySet().stream()
                .map(entry -> {
                    int month = Integer.parseInt(entry.getKey().substring(5));
                    List<Integer> days = entry.getValue();
                    java.util.Collections.sort(days);
                    
                    String[] koreanMonths = {"", "1월", "2월", "3월", "4월", "5월", "6월", 
                                           "7월", "8월", "9월", "10월", "11월", "12월"};
                    
                    return koreanMonths[month] + " " + 
                           days.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(" "));
                })
                .collect(java.util.stream.Collectors.joining(", "));
    }
    
    /**
     * 웹 API용 Map 형식 변환
     */
    public Map<String, MultipleCalendarService.CalendarGroup> toWebResponse() {
        return calendarGroups;
    }
    
    /**
     * 캐시 키 생성
     */
    public String getCacheKey() {
        return String.format("calendar:user:%s:range:%s:%s", userId, startDate, endDate);
    }
    
    /**
     * Discord 봇용 통계 정보 생성
     */
    public com.crimecat.backend.schedule.dto.MyScheduleResponse toDiscordResponse(int requestedMonths) {
        return com.crimecat.backend.schedule.dto.MyScheduleResponse.builder()
                .discordSnowflake(userId.toString())  // Discord ID 매핑 필요
                .koreanDateFormat(toKoreanDateFormat())
                .totalEvents(statistics.getTotalEvents())
                .requestedMonths(requestedMonths)
                .calendarCount(statistics.getTotalCalendars())
                .syncedAt(statistics.getLastSyncedAt())
                .isWebUserRegistered(true)
                .hasICalCalendars(statistics.getTotalCalendars() > 0)
                .build();
    }
}