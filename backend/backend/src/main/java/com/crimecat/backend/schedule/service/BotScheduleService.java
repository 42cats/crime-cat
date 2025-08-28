package com.crimecat.backend.schedule.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.exception.ServiceException;
import com.crimecat.backend.schedule.dto.MyScheduleResponse;
import com.crimecat.backend.schedule.dto.ScheduleOverlapRequest;
import com.crimecat.backend.schedule.dto.ScheduleOverlapResponse;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.webUser.repository.WebUserRepository;
import com.crimecat.backend.schedule.domain.UserCalendar;
import com.crimecat.backend.schedule.repository.UserCalendarRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Discord 봇 일정 관리 서비스
 * 실시간 iCal 파싱 + Redis 캐싱 (30분 TTL)
 */
@Slf4j
@Service
public class BotScheduleService {

    private final WebUserRepository webUserRepository;
    private final UserCalendarRepository userCalendarRepository;
    private final MultipleCalendarService multipleCalendarService;
    private final DateFormatService dateFormatService;
    private final OptimizedBlockedDateService blockedDateService;
    private final RedisTemplate<String, Object> redisTemplate;
    
    // 명시적 생성자 - MultipleCalendarService + OptimizedBlockedDateService 추가 (웹과 동일한 방식 사용)
    public BotScheduleService(
            WebUserRepository webUserRepository,
            UserCalendarRepository userCalendarRepository,
            MultipleCalendarService multipleCalendarService,
            DateFormatService dateFormatService,
            OptimizedBlockedDateService blockedDateService,
            @Qualifier("redisObjectTemplate") RedisTemplate<String, Object> redisTemplate) {
        this.webUserRepository = webUserRepository;
        this.userCalendarRepository = userCalendarRepository;
        this.multipleCalendarService = multipleCalendarService;
        this.dateFormatService = dateFormatService;
        this.blockedDateService = blockedDateService;
        this.redisTemplate = redisTemplate;
    }

    // Redis 캐시 키 템플릿
    private static final String CACHE_KEY_MY_SCHEDULE = "discord:schedule:user:%s:months:%d";
    private static final String CACHE_KEY_OVERLAP_CHECK = "discord:schedule:overlap:%s:%s:%d";
    private static final int CACHE_TTL_MINUTES = 30;
    
    /**
     * Discord 사용자의 내일정 조회 (/내일정 명령어)
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param months 조회할 개월 수 (기본: 3개월)
     * @return 내일정 응답 데이터
     */
    @Transactional(readOnly = true)
    public MyScheduleResponse getMySchedule(String discordSnowflake, int months) {
        log.info("📅 내일정 조회 시작: discordSnowflake={}, months={}", discordSnowflake, months);
        
        try {
            // 입력 유효성 검사
            validateDiscordSnowflake(discordSnowflake);
            validateMonths(months);
            
            // Redis 캐시 확인
            String cacheKey = String.format(CACHE_KEY_MY_SCHEDULE, discordSnowflake, months);
            MyScheduleResponse cached = (MyScheduleResponse) redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.info("✅ 캐시에서 내일정 조회 완료: {} 개 날짜", cached.getTotalEvents());
                return cached;
            }
            
            // 1. Discord 사용자 → User → WebUser 조회
            WebUser webUser = findWebUserByDiscordSnowflake(discordSnowflake);
            
            // 2. 웹과 동일한 방식으로 모든 캘린더 동기화 (부분 실패 허용)
            try {
                multipleCalendarService.syncAllUserCalendars(webUser.getId());
            } catch (Exception e) {
                log.warn("⚠️ 캘린더 동기화 중 일부 실패 (계속 진행): {}", e.getMessage());
            }
            
            // 3. 모든 활성 캘린더 조회 (동기화 실패한 것도 포함)
            List<UserCalendar> allActiveCalendars = userCalendarRepository.findActiveCalendarsByUserId(webUser.getId());
            
            if (allActiveCalendars.isEmpty()) {
                throw new ServiceException(ErrorStatus.CALENDAR_NOT_REGISTERED);
            }
            
            // 4. 실시간 이벤트 데이터 조회 (MultipleCalendarService 사용)
            Set<LocalDate> allDates = new HashSet<>();
            int successfulCalendarCount = 0;
            
            try {
                // 날짜 범위 설정
                LocalDate startDate = LocalDate.now();
                LocalDate endDate = startDate.plusMonths(months);
                
                // 그룹화된 캘린더 이벤트 조회
                Map<String, MultipleCalendarService.CalendarGroup> calendarGroups = 
                    multipleCalendarService.getGroupedCalendarEvents(webUser.getId(), startDate, endDate);
                
                // 모든 캘린더의 이벤트에서 날짜 추출
                for (MultipleCalendarService.CalendarGroup group : calendarGroups.values()) {
                    if (group.getEvents() != null) {
                        Set<LocalDate> groupDates = group.getEvents().stream()
                                .map(event -> event.getStartTime().toLocalDate())
                                .collect(Collectors.toSet());
                        allDates.addAll(groupDates);
                        successfulCalendarCount++;
                        log.debug("📅 캘린더 그룹에서 {} 개 날짜 추출: {}", 
                                groupDates.size(), group.getDisplayName());
                    }
                }
                
                log.info("✅ 총 {} 개 캘린더 중 {} 개에서 데이터 성공적으로 조회", 
                        allActiveCalendars.size(), successfulCalendarCount);
                        
            } catch (Exception e) {
                log.warn("⚠️ 캘린더 이벤트 조회 중 오류 (빈 결과로 계속): {}", e.getMessage());
                // 빈 결과로 계속 진행 (완전 실패가 아닌 부분 실패 처리)
            }
            
            // 5. 한국어 형식으로 변환
            String koreanDateFormat = dateFormatService.formatDatesToKorean(allDates);
            
            // 6. 웹페이지 차단 날짜 조회
            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusMonths(months);
            Set<LocalDate> blockedDates = blockedDateService.getUserBlockedDatesInRange(
                webUser.getId(), startDate, endDate);
            
            // 7. 사용 가능한 날짜 계산 (전체 기간 - iCal 일정 - 웹 차단 날짜)
            Set<LocalDate> allDatesInRange = generateDateRange(startDate, endDate);
            Set<LocalDate> busyDates = dateFormatService.parseKoreanDates(koreanDateFormat);
            
            Set<LocalDate> availableDates = allDatesInRange.stream()
                .filter(date -> !busyDates.contains(date))        // iCal 일정 제외
                .filter(date -> !blockedDates.contains(date))     // 웹 차단 날짜 제외
                .collect(Collectors.toSet());
            
            String availableDatesFormat = dateFormatService.formatDatesToKorean(availableDates);
            double availabilityRatio = allDatesInRange.isEmpty() ? 0.0 : 
                (double) availableDates.size() / allDatesInRange.size();
            
            // 8. 응답 데이터 생성 (사용 가능한 날짜 포함)
            MyScheduleResponse response = MyScheduleResponse.builder()
                    .discordSnowflake(discordSnowflake)
                    .koreanDateFormat(koreanDateFormat)
                    .availableDatesFormat(availableDatesFormat)
                    .totalEvents(allDates.size())
                    .totalAvailableDays(availableDates.size())
                    .totalBlockedDays(blockedDates.size())
                    .availabilityRatio(Math.round(availabilityRatio * 10000.0) / 10000.0)
                    .requestedMonths(months)
                    .calendarCount(allActiveCalendars.size())
                    .syncedAt(LocalDateTime.now())
                    .isWebUserRegistered(true)
                    .hasICalCalendars(true)
                    .build();
            
            log.info("📊 가용성 분석: 전체 {}일 중 사용가능 {}일 ({}%), 차단 {}일, iCal 일정 {}일", 
                allDatesInRange.size(), availableDates.size(), 
                Math.round(availabilityRatio * 100), blockedDates.size(), allDates.size());
                    
            // 부분 실패 알림을 위한 추가 정보 로그
            if (successfulCalendarCount < allActiveCalendars.size()) {
                log.warn("⚠️ Discord 응답: {}/{} 캘린더에서 데이터 조회 성공", 
                        successfulCalendarCount, allActiveCalendars.size());
                
                // TODO: 향후 Discord 응답에 부분 실패 정보 포함할 수 있도록 필드 확장 고려
                // response에 partialFailureInfo 같은 필드 추가 가능
            }
            
            // 9. Redis 캐시 저장 (30분 TTL)
            redisTemplate.opsForValue().set(cacheKey, response, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            
            log.info("✅ 내일정 조회 완료: {} 개 날짜, {}/{} 개 캘린더 성공", 
                    allDates.size(), successfulCalendarCount, allActiveCalendars.size());
            return response;
            
        } catch (ServiceException e) {
            throw e; // 이미 올바른 예외이므로 그대로 전파
        } catch (Exception e) {
            log.error("❌ 내일정 조회 실패: discordSnowflake={}", discordSnowflake, e);
            throw new ServiceException(ErrorStatus.SCHEDULE_SERVICE_ERROR);
        }
    }
    
    /**
     * 입력 일정과 내일정 교차 체크 (/일정체크 명령어)
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param request 교차 체크 요청 데이터
     * @return 교차 체크 응답 데이터
     */
    @Transactional(readOnly = true)
    public ScheduleOverlapResponse checkScheduleOverlap(String discordSnowflake, ScheduleOverlapRequest request) {
        log.info("🔍 일정 교차체크 시작: discordSnowflake={}, inputDates={}", 
                discordSnowflake, request.getInputDates());
        
        try {
            // 입력 유효성 검사
            validateDiscordSnowflake(discordSnowflake);
            if (request.getInputDates() == null || request.getInputDates().trim().isEmpty()) {
                throw new ServiceException(ErrorStatus.INVALID_DATE_FORMAT);
            }
            
            int months = request.getMonths() != null ? request.getMonths() : 3;
            validateMonths(months);
            
            // Redis 캐시 확인
            String cacheKey = String.format(CACHE_KEY_OVERLAP_CHECK, 
                    discordSnowflake, 
                    request.getInputDates().hashCode(), 
                    months);
            ScheduleOverlapResponse cached = (ScheduleOverlapResponse) redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.info("✅ 캐시에서 교차체크 완료: {} 개 일치", cached.getTotalMatches());
                return cached;
            }
            
            // 1. 입력 날짜 파싱
            Set<LocalDate> inputDates;
            try {
                inputDates = dateFormatService.parseKoreanDates(request.getInputDates());
            } catch (Exception e) {
                log.error("❌ 날짜 파싱 실패: {}", request.getInputDates(), e);
                throw new ServiceException(ErrorStatus.INVALID_DATE_FORMAT);
            }
            
            if (inputDates.isEmpty()) {
                throw new ServiceException(ErrorStatus.INVALID_DATE_FORMAT);
            }
            
            // 2. 내일정 조회 (캐시 활용)
            MyScheduleResponse mySchedule = getMySchedule(discordSnowflake, months);
            Set<LocalDate> myDates = dateFormatService.parseKoreanDates(mySchedule.getKoreanDateFormat());
            
            // 3. 웹페이지 차단 날짜 조회 (입력 날짜 범위 내)
            WebUser webUser = findWebUserByDiscordSnowflake(discordSnowflake);
            LocalDate minInputDate = inputDates.stream().min(LocalDate::compareTo).orElse(LocalDate.now());
            LocalDate maxInputDate = inputDates.stream().max(LocalDate::compareTo).orElse(LocalDate.now());
            Set<LocalDate> blockedDates = blockedDateService.getUserBlockedDatesInRange(
                webUser.getId(), minInputDate, maxInputDate);
            
            // 4. 교집합 계산 (겹치는 날짜: iCal 일정과 겹치는 날짜)
            Set<LocalDate> overlappingDates = inputDates.stream()
                    .filter(myDates::contains)
                    .collect(Collectors.toSet());
            
            // 5. 입력 날짜 중 사용 가능한 날짜 계산 (iCal 일정 제외 + 웹 차단 제외)
            Set<LocalDate> availableDatesFromInput = inputDates.stream()
                    .filter(date -> !myDates.contains(date))        // iCal 일정 제외
                    .filter(date -> !blockedDates.contains(date))   // 웹 차단 날짜 제외
                    .collect(Collectors.toSet());
            
            // 6. 겹치는 날짜를 한국어 형식으로 변환
            String overlappingKoreanFormat = overlappingDates.isEmpty() ? 
                    "" : dateFormatService.formatDatesToKorean(overlappingDates);
            
            // 7. 사용 가능한 날짜를 한국어 형식으로 변환
            String availableDatesKoreanFormat = availableDatesFromInput.isEmpty() ?
                    "" : dateFormatService.formatDatesToKorean(availableDatesFromInput);
            
            // 8. 통계 계산
            double matchPercentage = inputDates.isEmpty() ? 0.0 : 
                    (double) overlappingDates.size() / inputDates.size() * 100.0;
            double availabilityRatio = inputDates.isEmpty() ? 0.0 :
                    (double) availableDatesFromInput.size() / inputDates.size();
            
            // 9. 응답 데이터 생성 (사용 가능한 날짜 포함)
            ScheduleOverlapResponse response = ScheduleOverlapResponse.builder()
                    .discordSnowflake(discordSnowflake)
                    .inputDates(request.getInputDates())
                    .overlappingDates(overlappingKoreanFormat)
                    .availableDatesFromInput(availableDatesKoreanFormat)
                    .inputTotal(inputDates.size())
                    .totalMatches(overlappingDates.size())
                    .totalAvailableFromInput(availableDatesFromInput.size())
                    .totalBlockedFromInput(blockedDates.stream()
                        .mapToInt(date -> inputDates.contains(date) ? 1 : 0).sum())
                    .availabilityRatioFromInput(Math.round(availabilityRatio * 10000.0) / 10000.0)
                    .userTotal(myDates.size())
                    .matchPercentage(Math.round(matchPercentage * 100.0) / 100.0)
                    .requestedMonths(months)
                    .checkedAt(LocalDateTime.now())
                    .build();
            
            log.info("📊 입력 날짜 분석: 전체 {}개 중 사용가능 {}개 ({}%), 차단 {}개, iCal 겹침 {}개", 
                inputDates.size(), availableDatesFromInput.size(), 
                Math.round(availabilityRatio * 100), 
                blockedDates.stream().mapToInt(date -> inputDates.contains(date) ? 1 : 0).sum(),
                overlappingDates.size());
            
            // 7. Redis 캐시 저장 (30분 TTL)
            redisTemplate.opsForValue().set(cacheKey, response, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            
            log.info("✅ 일정 교차체크 완료: 입력 {} 개, 겹침 {} 개 ({}%)", 
                    inputDates.size(), overlappingDates.size(), response.getMatchPercentage());
            return response;
            
        } catch (ServiceException e) {
            throw e; // 이미 올바른 예외이므로 그대로 전파
        } catch (Exception e) {
            log.error("❌ 일정 교차체크 실패: discordSnowflake={}", discordSnowflake, e);
            throw new ServiceException(ErrorStatus.SCHEDULE_SERVICE_ERROR);
        }
    }
    
    /**
     * 사용자 캐시 강제 갱신 (/일정갱신 명령어)
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @return 갱신 완료 메시지
     */
    @Transactional(readOnly = true)
    public String refreshUserCache(String discordSnowflake) {
        log.info("🔄 캐시 강제 갱신 시작: discordSnowflake={}", discordSnowflake);
        
        try {
            validateDiscordSnowflake(discordSnowflake);
            
            // 해당 사용자의 모든 캐시 키 삭제
            String pattern = String.format("discord:schedule:*%s*", discordSnowflake);
            Set<String> keys = redisTemplate.keys(pattern);
            
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("✅ {} 개 캐시 키 삭제 완료", keys.size());
            }
            
            // 즉시 새로운 데이터로 캐시 재생성 (기본 3개월)
            getMySchedule(discordSnowflake, 3);
            
            log.info("✅ 캐시 강제 갱신 완료: discordSnowflake={}", discordSnowflake);
            return "일정 캐시가 성공적으로 갱신되었습니다.";
            
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ 캐시 갱신 실패: discordSnowflake={}", discordSnowflake, e);
            throw new ServiceException(ErrorStatus.CACHE_REFRESH_FAILED);
        }
    }
    
    /**
     * Discord Snowflake로 WebUser 조회
     */
    private WebUser findWebUserByDiscordSnowflake(String discordSnowflake) {
        return webUserRepository.findByDiscordUserSnowflake(discordSnowflake)
                .orElseThrow(() -> new ServiceException(ErrorStatus.DISCORD_USER_NOT_LINKED));
    }
    
    /**
     * Discord Snowflake 유효성 검사
     */
    private void validateDiscordSnowflake(String discordSnowflake) {
        if (discordSnowflake == null || discordSnowflake.trim().isEmpty()) {
            throw new ServiceException(ErrorStatus.INVALID_DISCORD_SNOWFLAKE);
        }
        
        // Discord Snowflake는 18-19자리 숫자
        if (!discordSnowflake.matches("\\d{17,19}")) {
            throw new ServiceException(ErrorStatus.INVALID_DISCORD_SNOWFLAKE);
        }
    }
    
    /**
     * 개월 수 유효성 검사
     */
    private void validateMonths(int months) {
        if (months < 1 || months > 12) {
            throw new ServiceException(ErrorStatus.INVALID_MONTH_RANGE);
        }
    }
    
    /**
     * 날짜 범위 생성 유틸리티 메서드
     * @param startDate 시작 날짜 (포함)
     * @param endDate 종료 날짜 (포함하지 않음)
     * @return 날짜 범위 Set
     */
    private Set<LocalDate> generateDateRange(LocalDate startDate, LocalDate endDate) {
        Set<LocalDate> dateRange = new HashSet<>();
        LocalDate current = startDate;
        
        while (current.isBefore(endDate)) {
            dateRange.add(current);
            current = current.plusDays(1);
        }
        
        return dateRange;
    }
    
    /**
     * 캐시 상태 조회 (디버깅용)
     */
    public Map<String, Object> getCacheStatus(String discordSnowflake) {
        String pattern = String.format("discord:schedule:*%s*", discordSnowflake);
        Set<String> keys = redisTemplate.keys(pattern);
        
        Map<String, Object> cacheStatus = new HashMap<>();
        cacheStatus.put("totalCacheKeys", keys != null ? keys.size() : 0);
        cacheStatus.put("cacheKeys", keys);
        cacheStatus.put("cacheTtlMinutes", CACHE_TTL_MINUTES);
        
        if (keys != null) {
            for (String key : keys) {
                Long ttl = redisTemplate.getExpire(key, TimeUnit.MINUTES);
                cacheStatus.put(key + "_ttl_minutes", ttl);
            }
        }
        
        return cacheStatus;
    }
}