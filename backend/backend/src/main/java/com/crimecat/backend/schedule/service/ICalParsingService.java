package com.crimecat.backend.schedule.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * iCal (.ics) 파일 실시간 파싱 서비스
 * Google Calendar, Apple Calendar, Outlook 등의 iCal URL을 파싱하여 날짜 정보 추출
 */
@Slf4j
@Service
public class ICalParsingService {
    
    private final RestTemplate restTemplate;
    
    // iCal 날짜 포맷 패턴들
    private static final Pattern DTSTART_PATTERN = Pattern.compile("DTSTART(?:;[^:]*)?:([\\d]{8}T?[\\d]{0,6}Z?)");
    private static final Pattern DTEND_PATTERN = Pattern.compile("DTEND(?:;[^:]*)?:([\\d]{8}T?[\\d]{0,6}Z?)");
    private static final DateTimeFormatter ICAL_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter ICAL_DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
    
    public ICalParsingService() {
        this.restTemplate = new RestTemplate();
        // 타임아웃 설정 (10초)
        restTemplate.getRequestFactory();
    }
    
    /**
     * iCal URL에서 지정된 기간의 날짜 목록 추출
     * @param icalUrl iCal 파일 URL
     * @param months 조회할 개월 수
     * @return 날짜 목록 (중복 제거)
     */
    public Set<LocalDate> parseICalDates(String icalUrl, int months) {
        log.info("📅 iCal 파싱 시작: url={}, months={}",icalUrl, months);
        
        try {
            // 1. iCal 데이터 다운로드
            String icalData = downloadICalData(icalUrl);
            
            // 2. 이벤트 날짜 추출
            Set<LocalDate> dates = extractEventDates(icalData, months);
            
            log.info("✅ iCal 파싱 완료: {} 개 날짜 추출", dates.size());
            return dates;
            
        } catch (Exception e) {
            log.error("❌ iCal 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("캘린더 데이터를 읽을 수 없습니다: " + e.getMessage());
        }
    }
    
    /**
     * 여러 iCal URL의 날짜 목록을 통합
     * @param icalUrls iCal URL 목록
     * @param months 조회할 개월 수
     * @return 통합된 날짜 목록
     */
    public Set<LocalDate> parseMultipleICalDates(List<String> icalUrls, int months) {
        log.info("📅 다중 iCal 파싱 시작: {} 개 캘린더, {} 개월", icalUrls.size(), months);
        
        Set<LocalDate> allDates = new HashSet<>();
        List<String> errors = new ArrayList<>();
        
        for (String icalUrl : icalUrls) {
            try {
                Set<LocalDate> dates = parseICalDates(icalUrl, months);
                allDates.addAll(dates);
                log.debug("📅 캘린더 파싱 성공: {} 개 날짜", dates.size());
            } catch (Exception e) {
                log.warn("⚠️ 개별 캘린더 파싱 실패: {}", e.getMessage());
                errors.add(maskUrl(icalUrl) + ": " + e.getMessage());
            }
        }
        
        if (!errors.isEmpty() && allDates.isEmpty()) {
            throw new RuntimeException("모든 캘린더 파싱 실패: " + String.join(", ", errors));
        } else if (!errors.isEmpty()) {
            log.warn("⚠️ 일부 캘린더 파싱 실패: {}", errors);
        }
        
        log.info("✅ 다중 iCal 파싱 완료: 총 {} 개 날짜", allDates.size());
        return allDates;
    }
    
    /**
     * iCal 데이터 다운로드
     */
    private String downloadICalData(String icalUrl) {
        try {
            log.debug("🔄 iCal 다운로드: {}", maskUrl(icalUrl));
            
            String icalData = restTemplate.getForObject(icalUrl, String.class);
            
            if (icalData == null || icalData.trim().isEmpty()) {
                throw new RuntimeException("빈 캘린더 데이터");
            }
            
            if (!icalData.contains("BEGIN:VCALENDAR")) {
                throw new RuntimeException("유효하지 않은 iCal 형식");
            }
            
            log.debug("✅ iCal 다운로드 완료: {} bytes", icalData.length());
            return icalData;
            
        } catch (ResourceAccessException e) {
            throw new RuntimeException("캘린더 서버에 연결할 수 없습니다 (타임아웃 또는 네트워크 오류)");
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 404) {
                throw new RuntimeException("캘린더 URL을 찾을 수 없습니다 (404)");
            } else if (e.getStatusCode().value() == 403) {
                throw new RuntimeException("캘린더에 접근할 권한이 없습니다 (403)");
            } else {
                throw new RuntimeException("캘린더 서버 오류: " + e.getStatusCode());
            }
        }
    }
    
    /**
     * iCal 데이터에서 이벤트 날짜 추출
     */
    private Set<LocalDate> extractEventDates(String icalData, int months) {
        Set<LocalDate> dates = new HashSet<>();
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusMonths(months);
        
        // 이벤트 블록별로 분할
        String[] events = icalData.split("BEGIN:VEVENT");
        
        for (String event : events) {
            if (!event.contains("DTSTART")) continue;
            
            try {
                LocalDate eventDate = extractEventDate(event);
                
                // 지정된 기간 내의 날짜만 포함
                if (eventDate != null && 
                    !eventDate.isBefore(startDate) && 
                    eventDate.isBefore(endDate)) {
                    dates.add(eventDate);
                }
                
            } catch (Exception e) {
                log.debug("⚠️ 개별 이벤트 파싱 실패: {}", e.getMessage());
                // 개별 이벤트 실패는 무시하고 계속 진행
            }
        }
        
        log.debug("📅 이벤트 날짜 추출 완료: {} 개 (기간: {} ~ {})", 
                 dates.size(), startDate, endDate.minusDays(1));
        return dates;
    }
    
    /**
     * 단일 이벤트에서 날짜 추출
     */
    private LocalDate extractEventDate(String event) {
        Matcher dtStartMatcher = DTSTART_PATTERN.matcher(event);
        
        if (!dtStartMatcher.find()) {
            return null;
        }
        
        String dateTimeString = dtStartMatcher.group(1);
        
        try {
            // 날짜만 있는 경우 (YYYYMMDD)
            if (dateTimeString.length() == 8) {
                return LocalDate.parse(dateTimeString, ICAL_DATE_FORMAT);
            }
            
            // 날짜+시간이 있는 경우 (YYYYMMDDTHHMMSS 또는 YYYYMMDDTHHMMSSZ)
            String dateOnly = dateTimeString.substring(0, 8);
            return LocalDate.parse(dateOnly, ICAL_DATE_FORMAT);
            
        } catch (DateTimeParseException e) {
            log.debug("⚠️ 날짜 파싱 실패: {}", dateTimeString);
            return null;
        }
    }
    
    /**
     * URL 마스킹 (로그용)
     */
    private String maskUrl(String url) {
        if (url == null || url.length() < 20) return url;
        return url.substring(0, 20) + "...";
    }
    
    /**
     * iCal URL 유효성 검증
     */
    public boolean isValidICalUrl(String icalUrl) {
        try {
            downloadICalData(icalUrl);
            return true;
        } catch (Exception e) {
            log.debug("🚫 iCal URL 유효성 검증 실패: {}", e.getMessage());
            return false;
        }
    }
}