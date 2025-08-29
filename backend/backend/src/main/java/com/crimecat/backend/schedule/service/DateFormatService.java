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
     * 한국어 날짜 문자열을 LocalDate 목록으로 파싱 (날짜 범위 고려)
     * @param dateString 한국어 날짜 문자열
     * @param startDate 유효 범위 시작일
     * @param endDate 유효 범위 종료일
     * @return 범위 내 유효한 LocalDate 목록
     */
    public List<LocalDate> parseDateString(String dateString, LocalDate startDate, LocalDate endDate) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        List<LocalDate> dates = new ArrayList<>();
        
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
                    
                    // 스마트 연도 결정 알고리즘 적용
                    Integer determinedYear = determineYear(month, day, startDate, endDate);
                    
                    if (determinedYear != null) {
                        LocalDate date = LocalDate.of(determinedYear, month, day);
                        dates.add(date);
                        log.debug("📅 날짜 결정: {}월 {}일 → {}", month, day, date);
                    } else {
                        log.warn("⚠️ 범위를 벗어난 날짜: {}월 {}일 (범위: {} ~ {})", 
                                month, day, startDate, endDate);
                    }
                } catch (NumberFormatException e) {
                    log.warn("⚠️ 날짜 파싱 실패: {}", dayString);
                }
            }
        }
        
        log.debug("📅 날짜 파싱 완료 (범위 고려): {} → {} 개 (범위: {} ~ {})", 
                dateString, dates.size(), startDate, endDate);
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
     * 스마트 연도 결정 알고리즘
     * 주어진 월/일에 대해 startDate와 endDate 범위 내에서 적절한 연도를 결정
     * 
     * @param month 월 (1-12)
     * @param day 일 (1-31)
     * @param startDate 유효 범위 시작일
     * @param endDate 유효 범위 종료일
     * @return 결정된 연도 또는 null (범위 내에 해당하는 연도가 없음)
     */
    private Integer determineYear(int month, int day, LocalDate startDate, LocalDate endDate) {
        // 1. 월/일이 유효한지 기본 검증
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
        }
        
        // 2. 시작일과 종료일의 연도 범위 확인
        int startYear = startDate.getYear();
        int endYear = endDate.getYear();
        
        // 3. 가능한 모든 연도에 대해 검사 (일반적으로 최대 2년)
        for (int candidateYear = startYear; candidateYear <= endYear; candidateYear++) {
            try {
                LocalDate candidateDate = LocalDate.of(candidateYear, month, day);
                
                // 4. 범위 내에 있고 유효한 날짜인지 확인
                if (!candidateDate.isBefore(startDate) && !candidateDate.isAfter(endDate)) {
                    log.debug("🎯 연도 결정 성공: {}월 {}일 → {} (범위: {} ~ {})", 
                            month, day, candidateDate, startDate, endDate);
                    return candidateYear;
                }
                
            } catch (Exception e) {
                // 유효하지 않은 날짜 (예: 2월 30일)는 건너뜀
                log.debug("⚠️ 유효하지 않은 날짜: {}년 {}월 {}일", candidateYear, month, day);
                continue;
            }
        }
        
        // 5. 범위 내에서 해당하는 연도가 없는 경우
        log.debug("❌ 연도 결정 실패: {}월 {}일 (범위: {} ~ {})", 
                month, day, startDate, endDate);
        return null;
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
     * 연도 경계를 고려하여 시간순 정렬 (예: 12월 → 1월)
     * 예: [LocalDate(2024,12,25), LocalDate(2025,1,10)] → "12월 25, 1월 10"
     */
    public String formatDatesToKorean(Set<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) {
            return "등록된 일정이 없습니다";
        }
        
        // 날짜별로 시간순 정렬 (연도 경계 고려)
        List<LocalDate> sortedDates = dates.stream()
                .sorted()  // LocalDate 자연순 정렬 (시간 순서)
                .collect(Collectors.toList());
        
        // 연도-월별로 그룹화 (시간순 유지)
        Map<String, List<Integer>> chronologicalMonths = new LinkedHashMap<>();
        
        for (LocalDate date : sortedDates) {
            int year = date.getYear();
            int month = date.getMonthValue();
            int day = date.getDayOfMonth();
            
            // 연도-월 키 생성 (시간순 정렬을 위해)
            String yearMonthKey = year + "-" + String.format("%02d", month);
            
            chronologicalMonths.computeIfAbsent(yearMonthKey, k -> new ArrayList<>()).add(day);
        }
        
        // 시간순으로 문자열 생성 (연도 표시 없음)
        StringBuilder result = new StringBuilder();
        boolean first = true;
        
        for (Map.Entry<String, List<Integer>> entry : chronologicalMonths.entrySet()) {
            if (!first) {
                result.append(", ");
            }
            first = false;
            
            // 키에서 월 정보 추출 (YYYY-MM 형식)
            String yearMonthKey = entry.getKey();
            int month = Integer.parseInt(yearMonthKey.substring(5)); // MM 부분
            
            List<Integer> days = entry.getValue();
            Collections.sort(days); // 날짜 정렬
            
            result.append(KOREAN_MONTHS[month]).append(" ");
            result.append(days.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(" ")));
        }
        
        log.debug("📅 날짜 포맷팅 완료 (시간순): {} → {}", dates.size(), result.toString());
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
    
    /**
     * 한국어 날짜 문자열을 LocalDate Set으로 파싱 (날짜 범위 고려)
     * @param dateString 한국어 날짜 문자열 (예: "10월 1 2 3 4")
     * @param startDate 유효 범위 시작일
     * @param endDate 유효 범위 종료일
     * @return 범위 내 유효한 LocalDate Set
     */
    public Set<LocalDate> parseKoreanDates(String dateString, LocalDate startDate, LocalDate endDate) {
        List<LocalDate> dateList = parseDateString(dateString, startDate, endDate);
        return new HashSet<>(dateList);
    }
}