package com.crimecat.backend.schedule.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 날짜 포맷팅 및 파싱 서비스
 * Discord 봇용 한국어 날짜 처리 전담
 */
@Slf4j
@Service
public class DateFormatService {
    
    private static final String[] KOREAN_MONTHS = {
        "", "1월", "2월", "3월", "4월", "5월", "6월", 
        "7월", "8월", "9월", "10월", "11월", "12월"
    };
    
    
    /**
     * 한국어 날짜 문자열을 LocalDate 목록으로 파싱
     * 예: "10월 1 2 3 4" → [LocalDate(2025,10,1), LocalDate(2025,10,2), ...]
     */
    public List<LocalDate> parseDateString(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        List<LocalDate> dates = new ArrayList<>();
        int currentYear = LocalDate.now().getYear();
        
        // 패턴: "N월 숫자1 숫자2 숫자3, M월 숫자4 숫자5"
        Pattern pattern = Pattern.compile("(\\d+)월\\s+([\\d\\s]+)");
        Matcher matcher = pattern.matcher(dateString);
        
        while (matcher.find()) {
            int month = Integer.parseInt(matcher.group(1));
            String daysString = matcher.group(2).trim();
            
            // 공백으로 구분된 날짜들 파싱
            String[] dayStrings = daysString.split("\\s+");
            
            for (String dayString : dayStrings) {
                try {
                    int day = Integer.parseInt(dayString.trim());
                    
                    // 유효한 날짜인지 확인
                    if (isValidDate(currentYear, month, day)) {
                        LocalDate date = LocalDate.of(currentYear, month, day);
                        dates.add(date);
                    } else {
                        log.warn("⚠️ 유효하지 않은 날짜: {}년 {}월 {}일", currentYear, month, day);
                    }
                } catch (NumberFormatException e) {
                    log.warn("⚠️ 날짜 파싱 실패: {}", dayString);
                }
            }
        }
        
        log.debug("📅 날짜 파싱 완료: {} → {} 개", dateString, dates.size());
        return dates;
    }
    
    /**
     * 두 날짜 목록의 교차점 찾기
     */
    public List<LocalDate> findOverlappingDates(List<LocalDate> inputDates, List<LocalDate> userDates) {
        Set<LocalDate> userDateSet = new HashSet<>(userDates);
        
        return inputDates.stream()
                .filter(userDateSet::contains)
                .sorted()
                .collect(Collectors.toList());
    }
    
    /**
     * 교차점 날짜 목록을 한국어 문자열로 변환 (월 포함)
     * 예: [LocalDate(2025,10,2), LocalDate(2025,10,4)] → "10월 2, 4"
     */
    public String formatOverlappingDates(List<LocalDate> overlappingDates) {
        if (overlappingDates == null || overlappingDates.isEmpty()) {
            return "겹치는 날짜가 없습니다";
        }
        
        // 월별로 그룹화
        Map<Integer, List<Integer>> monthlyDates = new TreeMap<>();
        
        for (LocalDate date : overlappingDates) {
            int month = date.getMonthValue();
            int day = date.getDayOfMonth();
            
            monthlyDates.computeIfAbsent(month, k -> new ArrayList<>()).add(day);
        }
        
        // 월별로 정렬하여 문자열 생성
        StringBuilder result = new StringBuilder();
        boolean first = true;
        
        for (Map.Entry<Integer, List<Integer>> entry : monthlyDates.entrySet()) {
            if (!first) {
                result.append(", ");
            }
            first = false;
            
            int month = entry.getKey();
            List<Integer> days = entry.getValue();
            Collections.sort(days);
            
            result.append(KOREAN_MONTHS[month]).append(" ");
            // 날짜들을 쉼표로 구분 (월 단위에서만)
            result.append(days.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(", ")));
        }
        
        log.debug("📅 교차점 포맷팅 완료: {} → {}", overlappingDates.size(), result.toString());
        return result.toString();
    }
    
    /**
     * 유효한 날짜인지 확인
     */
    private boolean isValidDate(int year, int month, int day) {
        try {
            LocalDate.of(year, month, day);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 일치율 계산 (백분율)
     */
    public double calculateMatchPercentage(int matches, int total) {
        if (total == 0) return 0.0;
        return Math.round((double) matches / total * 100.0 * 100.0) / 100.0;
    }
    
    /**
     * LocalDate Set을 한국어 문자열로 변환 (Discord 봇용)
     * 예: [LocalDate(2025,8,28), LocalDate(2025,9,3)] → "8월 28, 9월 3"
     */
    public String formatDatesToKorean(Set<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) {
            return "등록된 일정이 없습니다";
        }
        
        // 월별로 그룹화
        Map<Integer, List<Integer>> monthlyDates = new TreeMap<>();
        
        for (LocalDate date : dates) {
            int month = date.getMonthValue();
            int day = date.getDayOfMonth();
            
            monthlyDates.computeIfAbsent(month, k -> new ArrayList<>()).add(day);
        }
        
        // 월별로 정렬하여 문자열 생성
        StringBuilder result = new StringBuilder();
        boolean first = true;
        
        for (Map.Entry<Integer, List<Integer>> entry : monthlyDates.entrySet()) {
            if (!first) {
                result.append(", ");
            }
            first = false;
            
            int month = entry.getKey();
            List<Integer> days = entry.getValue();
            Collections.sort(days);
            
            result.append(KOREAN_MONTHS[month]).append(" ");
            result.append(days.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(" ")));
        }
        
        log.debug("📅 날짜 포맷팅 완료: {} → {}", dates.size(), result.toString());
        return result.toString();
    }
    
    /**
     * 한국어 날짜 문자열을 LocalDate Set으로 파싱 (Discord 봇용)
     * 예: "10월 1 2 3 4" → Set<LocalDate>
     */
    public Set<LocalDate> parseKoreanDates(String dateString) {
        List<LocalDate> dateList = parseDateString(dateString);
        return new HashSet<>(dateList);
    }
}