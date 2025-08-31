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
    private final UnifiedCalendarCacheService unifiedCacheService;
    private final RedisTemplate<String, Object> redisTemplate;
    
    // 명시적 생성자 - UnifiedCalendarCacheService 추가
    public BotScheduleService(
            WebUserRepository webUserRepository,
            UserCalendarRepository userCalendarRepository,
            MultipleCalendarService multipleCalendarService,
            DateFormatService dateFormatService,
            OptimizedBlockedDateService blockedDateService,
            UnifiedCalendarCacheService unifiedCacheService,
            @Qualifier("redisObjectTemplate") RedisTemplate<String, Object> redisTemplate) {
        this.webUserRepository = webUserRepository;
        this.userCalendarRepository = userCalendarRepository;
        this.multipleCalendarService = multipleCalendarService;
        this.dateFormatService = dateFormatService;
        this.blockedDateService = blockedDateService;
        this.unifiedCacheService = unifiedCacheService;
        this.redisTemplate = redisTemplate;
    }

    // Redis 캐시 키 템플릿
    private static final String CACHE_KEY_MY_SCHEDULE = "discord:schedule:user:%s:months:%d";
    private static final String CACHE_KEY_OVERLAP_CHECK = "discord:schedule:overlap:%s:%s:%d";
    private static final int CACHE_TTL_MINUTES = 30;
    
    /**
     * Discord 사용자의 내일정 조회 (/내일정 명령어) - 통합 캐싱 적용
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param months 조회할 개월 수 (기본: 3개월)
     * @return 내일정 응답 데이터
     */
    @Transactional(readOnly = true)
    public MyScheduleResponse getMySchedule(String discordSnowflake, int months) {
        log.info("📅 [UNIFIED] 내일정 조회 시작: discordSnowflake={}, months={}", discordSnowflake, months);
        
        try {
            // 입력 유효성 검사
            validateDiscordSnowflake(discordSnowflake);
            validateMonths(months);
            
            // 🚀 통합 캐싱 서비스 사용 (3개월만 캐싱)
            if (months == 3) {
                // 3개월 디폴트값 - 통합 캐시 사용
                log.info("📦 [UNIFIED] 3개월 디폴트값 - 통합 캐시 사용: discordSnowflake={}", discordSnowflake);
                MyScheduleResponse response = unifiedCacheService.getDiscordSchedule(discordSnowflake, months);
                log.info("✅ [UNIFIED] 내일정 조회 완료 (캐싱): {} 개 이벤트", response.getTotalEvents());
                return response;
            } else {
                // 기타 개월 수 - 실시간 조회 (캐싱 없음)
                log.info("🔄 [UNIFIED] {}개월 요청 - 실시간 조회 (캐싱 없음)", months);
                MyScheduleResponse response = unifiedCacheService.getDiscordSchedule(discordSnowflake, months);
                log.info("✅ [UNIFIED] 내일정 조회 완료 (실시간): {} 개 이벤트", response.getTotalEvents());
                return response;
            }
            
        } catch (ServiceException e) {
            throw e; // 이미 올바른 예외이므로 그대로 전파
        } catch (Exception e) {
            log.error("❌ [UNIFIED] 내일정 조회 실패: discordSnowflake={}", discordSnowflake, e);
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
            
            // 2.1. 일정체크용 날짜 범위 설정 (내일정 조회 범위와 동일)
            LocalDate checkStartDate = LocalDate.now();
            LocalDate checkEndDate = checkStartDate.plusMonths(months);
            Set<LocalDate> myDates = dateFormatService.parseKoreanDates(
                mySchedule.getKoreanDateFormat(), checkStartDate, checkEndDate);
            
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
     * 사용자 캐시 강제 갱신 (/일정갱신 명령어) - 통합 캐싱 적용
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @return 갱신 완료 메시지
     */
    @Transactional(readOnly = true)
    public String refreshUserCache(String discordSnowflake) {
        log.info("🔄 [UNIFIED] 캐시 강제 갱신 시작: discordSnowflake={}", discordSnowflake);
        
        try {
            validateDiscordSnowflake(discordSnowflake);
            
            // Discord Snowflake → WebUser 조회
            var webUser = webUserRepository.findByDiscordUserSnowflake(discordSnowflake)
                    .orElseThrow(() -> new ServiceException(ErrorStatus.DISCORD_USER_NOT_LINKED));
            
            // 🚀 통합 캐싱 서비스를 통한 캐시 무효화
            unifiedCacheService.invalidateUserCache(webUser.getId());
            
            // 기존 Discord 전용 캐시도 삭제 (호환성 유지)
            String pattern = String.format("discord:schedule:*%s*", discordSnowflake);
            Set<String> keys = redisTemplate.keys(pattern);
            
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("✅ [UNIFIED] {} 개 기존 Discord 캐시 키 삭제 완료", keys.size());
            }
            
            // 즉시 새로운 데이터로 캐시 재생성 (기본 3개월)
            getMySchedule(discordSnowflake, 3);
            
            log.info("✅ [UNIFIED] 캐시 강제 갱신 완료: discordSnowflake={}", discordSnowflake);
            return "일정 캐시가 성공적으로 갱신되었습니다.";
            
        } catch (ServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ [UNIFIED] 캐시 갱신 실패: discordSnowflake={}", discordSnowflake, e);
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