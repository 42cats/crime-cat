package com.crimecat.backend.schedule.service;

import lombok.RequiredArgsConstructor;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.DtEnd;
import net.fortuna.ical4j.model.property.DtStart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.StringReader;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * iCalendar 데이터 파싱 전용 서비스
 * - iCal URL에서 데이터 가져오기
 * - VEvent 파싱 및 변환
 * - 캐싱을 통한 성능 최적화
 */
@Service
@RequiredArgsConstructor
public class ICalParsingService {
    
    private static final Logger log = LoggerFactory.getLogger(ICalParsingService.class);
    
    private final WebClient.Builder webClientBuilder;
    
    /**
     * iCal URL에서 상세 정보와 함께 이벤트 데이터 파싱
     */
    @Cacheable(value = "SCHEDULE_ICAL_DATA", key = "#icalUrl.hashCode() + '_detailed'")
    public List<Map<String, Object>> fetchAndParseIcalWithDetails(String icalUrl) {
        String icalContent = fetchIcalContent(icalUrl);
        if (icalContent == null || icalContent.isEmpty()) {
            return new ArrayList<>();
        }
        
        return parseIcalContent(icalContent);
    }
    
    /**
     * iCal URL에서 기본 시간 간격 데이터만 파싱 (하위 호환성)
     */
    @Cacheable(value = "SCHEDULE_ICAL_DATA", key = "#icalUrl.hashCode()")
    public List<LocalDateTime[]> fetchAndParseIcal(String icalUrl) {
        String icalContent = fetchIcalContent(icalUrl);
        if (icalContent == null || icalContent.isEmpty()) {
            return new ArrayList<>();
        }
        
        return parseIcalContentForTimeIntervals(icalContent);
    }
    
    /**
     * iCal URL에서 콘텐츠 가져오기
     */
    private String fetchIcalContent(String icalUrl) {
        WebClient webClient = webClientBuilder.build();
        
        try {
            java.net.URI uri = java.net.URI.create(icalUrl);
            return webClient.get().uri(uri).retrieve().bodyToMono(String.class).block();
        } catch (Exception e) {
            log.error("Failed to fetch iCalendar from URL: {} - {}", icalUrl, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * iCal 콘텐츠를 상세 정보와 함께 파싱
     */
    private List<Map<String, Object>> parseIcalContent(String icalContent) {
        List<Map<String, Object>> events = new ArrayList<>();
        
        try {
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalContent));

            for (Object component : calendar.getComponents(Component.VEVENT)) {
                VEvent event = (VEvent) component;
                Map<String, Object> eventDetails = parseVEvent(event);
                if (eventDetails != null) {
                    events.add(eventDetails);
                }
            }
            
            log.debug("Parsed {} events from iCalendar", events.size());
        } catch (Exception e) {
            log.error("Failed to parse iCalendar content: {}", e.getMessage(), e);
        }
        
        return events;
    }
    
    /**
     * iCal 콘텐츠를 시간 간격 배열로만 파싱 (하위 호환성)
     */
    private List<LocalDateTime[]> parseIcalContentForTimeIntervals(String icalContent) {
        List<LocalDateTime[]> busyTimes = new ArrayList<>();
        
        try {
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icalContent));

            for (Object component : calendar.getComponents(Component.VEVENT)) {
                VEvent event = (VEvent) component;
                LocalDateTime[] timeInterval = parseVEventForTimeInterval(event);
                if (timeInterval != null) {
                    busyTimes.add(timeInterval);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse iCalendar content for time intervals: {}", e.getMessage(), e);
        }
        
        return busyTimes;
    }
    
    /**
     * VEvent를 상세 정보가 포함된 Map으로 변환
     */
    private Map<String, Object> parseVEvent(VEvent event) {
        DtStart dtStart = event.getStartDate();
        DtEnd dtEnd = event.getEndDate();
        
        if (dtStart == null || dtEnd == null) {
            return null;
        }
        
        LocalDateTime start = dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime end = dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        
        Map<String, Object> eventDetails = new HashMap<>();
        eventDetails.put("startTime", start);
        eventDetails.put("endTime", end);
        eventDetails.put("title", event.getSummary() != null ? event.getSummary().getValue() : "개인 일정");
        eventDetails.put("description", event.getDescription() != null ? event.getDescription().getValue() : null);
        
        return eventDetails;
    }
    
    /**
     * VEvent를 시간 간격 배열로 변환 (하위 호환성)
     */
    private LocalDateTime[] parseVEventForTimeInterval(VEvent event) {
        DtStart dtStart = event.getStartDate();
        DtEnd dtEnd = event.getEndDate();
        
        if (dtStart == null || dtEnd == null) {
            return null;
        }
        
        LocalDateTime start = dtStart.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        LocalDateTime end = dtEnd.getDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        
        return new LocalDateTime[]{start, end};
    }
}