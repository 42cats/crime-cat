package com.crimecat.backend.schedule.controller;

import com.crimecat.backend.schedule.dto.MyScheduleResponse;
import com.crimecat.backend.schedule.dto.ScheduleOverlapRequest;
import com.crimecat.backend.schedule.dto.ScheduleOverlapResponse;
import com.crimecat.backend.schedule.service.BotScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Discord 봇 전용 스케줄 API 컨트롤러
 * /bot/v1/schedule/** 경로로 Discord 봇에서만 접근 가능
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/schedule")
public class BotScheduleController {

    private final BotScheduleService botScheduleService;

    /**
     * 사용자의 등록된 iCal 일정 조회 (개월 수 지원)
     * GET /bot/v1/schedule/user/{discordSnowflake}/my-schedule?months=3
     * 
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param months 조회할 개월 수 (기본값: 3)
     * @return 한국어 형식으로 포맷된 일정 목록과 동기화 정보
     */
    @GetMapping("/user/{discordSnowflake}/my-schedule")
    public ResponseEntity<MyScheduleResponse> getMySchedule(
            @PathVariable String discordSnowflake,
            @RequestParam(defaultValue = "3") int months) {
        
        log.info("📅 내일정 조회 요청: discordSnowflake={}, months={}", discordSnowflake, months);
        
        try {
            MyScheduleResponse response = botScheduleService.getMySchedule(discordSnowflake, months);
            log.info("📅 내일정 조회 성공: totalEvents={}, calendarCount={}, syncedAt={}", 
                    response.getTotalEvents(), response.getCalendarCount(), response.getSyncedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("❌ 내일정 조회 실패: discordSnowflake={}, error={}", 
                    discordSnowflake, e.getMessage());
            throw e;
        }
    }

    /**
     * 입력된 일정과 사용자 일정의 교차 체크
     * POST /bot/v1/schedule/user/{discordSnowflake}/check-overlap
     * 
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @param request 입력된 날짜 목록 (예: "10월 1 2 3 4")
     * @return 겹치는 날짜 목록 (월 포함, 예: "10월 2, 4")
     */
    @PostMapping("/user/{discordSnowflake}/check-overlap")
    public ResponseEntity<ScheduleOverlapResponse> checkScheduleOverlap(
            @PathVariable String discordSnowflake,
            @RequestBody ScheduleOverlapRequest request) {
        
        log.info("🔍 일정 교차체크 요청: discordSnowflake={}, inputDates={}, months={}", 
                discordSnowflake, request.getInputDates(), request.getMonths());
        
        try {
            ScheduleOverlapResponse response = botScheduleService.checkScheduleOverlap(
                    discordSnowflake, request);
            
            log.info("🔍 일정 교차체크 성공: totalMatches={}, overlappingDates={}", 
                    response.getTotalMatches(), response.getOverlappingDates());
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("❌ 일정 교차체크 실패: discordSnowflake={}, error={}", 
                    discordSnowflake, e.getMessage());
            throw e;
        }
    }

    /**
     * 사용자 캘린더 캐시 강제 갱신
     * POST /bot/v1/schedule/user/{discordSnowflake}/refresh-cache
     * 
     * @param discordSnowflake Discord 사용자 Snowflake ID
     * @return 갱신 완료 메시지
     */
    @PostMapping("/user/{discordSnowflake}/refresh-cache")
    public ResponseEntity<String> refreshUserCache(
            @PathVariable String discordSnowflake) {
        
        log.info("🔄 캐시 갱신 요청: discordSnowflake={}", discordSnowflake);
        
        try {
            String result = botScheduleService.refreshUserCache(discordSnowflake);
            log.info("🔄 캐시 갱신 성공: discordSnowflake={}", discordSnowflake);
            
            return ResponseEntity.ok(result);
            
        } catch (RuntimeException e) {
            log.error("❌ 캐시 갱신 실패: discordSnowflake={}, error={}", 
                    discordSnowflake, e.getMessage());
            throw e;
        }
    }
}