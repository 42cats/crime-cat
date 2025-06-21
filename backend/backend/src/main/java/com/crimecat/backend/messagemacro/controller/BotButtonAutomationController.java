package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.BotButtonAutomationResponseDto;
import com.crimecat.backend.messagemacro.service.ButtonAutomationService;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/bot/v1/automations")
@RequiredArgsConstructor
@Validated
public class BotButtonAutomationController {
    
    private final ButtonAutomationService buttonAutomationService;
    private final GuildRepository guildRepository;

    /**
     * 봇용 - 특정 길드의 모든 자동화 데이터 조회
     * Discord 봇이 버튼 생성 시 사용
     */
    @GetMapping("/{guildId}")
    public ResponseEntity<List<BotButtonAutomationResponseDto.Group>> getBotAutomationData(
            @PathVariable @NonNull String guildId,
            @RequestHeader(value = "X-Bot-Token", required = false) String botToken) {
        
        // 봇 토큰 검증 (선택사항 - 보안 요구사항에 따라)
        validateBotAccess(botToken);
        
        // 길드 존재 여부 확인
        Guild guild = guildRepository.findBySnowflake(guildId)
                .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asControllerException);
        
        List<BotButtonAutomationResponseDto.Group> automationData = buttonAutomationService.getBotData(guildId);
        
        log.info("Bot retrieved automation data for guild: {} - {} groups", guildId, automationData.size());
        return ResponseEntity.ok(automationData);
    }

    /**
     * 봇용 - 특정 버튼의 설정 조회
     * Discord 봇이 버튼 클릭 시 실행할 설정을 가져올 때 사용
     */
    @GetMapping("/buttons/{buttonId}")
    public ResponseEntity<BotButtonAutomationResponseDto> getBotButtonData(
            @PathVariable @NonNull UUID buttonId,
            @RequestHeader(value = "X-Bot-Token", required = false) String botToken) {
        
        validateBotAccess(botToken);
        
        BotButtonAutomationResponseDto buttonData = buttonAutomationService.getBotButtonData(buttonId)
                .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asControllerException);
        
        log.info("Bot retrieved button data: {}", buttonId);
        return ResponseEntity.ok(buttonData);
    }

    /**
     * 봇용 - 길드의 활성화된 자동화 통계
     * 디스코드 명령어에서 통계 표시 시 사용
     */
    @GetMapping("/{guildId}/stats")
    public ResponseEntity<BotStatsResponse> getBotStats(
            @PathVariable @NonNull String guildId,
            @RequestHeader(value = "X-Bot-Token", required = false) String botToken) {
        
        validateBotAccess(botToken);
        
        // 길드 존재 여부 확인
        guildRepository.findBySnowflake(guildId)
                .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asControllerException);
        
        long groupCount = buttonAutomationService.countActiveGroups(guildId);
        long buttonCount = buttonAutomationService.countActiveButtons(guildId);
        
        BotStatsResponse stats = BotStatsResponse.builder()
                .guildId(guildId)
                .activeGroupCount(groupCount)
                .activeButtonCount(buttonCount)
                .build();
        
        log.info("Bot retrieved stats for guild: {} - {} groups, {} buttons", guildId, groupCount, buttonCount);
        return ResponseEntity.ok(stats);
    }

    /**
     * 봇용 - 헬스체크
     * 봇에서 API 연결 상태 확인용
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(HealthResponse.builder()
                .status("UP")
                .service("button-automation")
                .timestamp(System.currentTimeMillis())
                .build());
    }

    // ===== 유틸리티 메서드 =====

    private void validateBotAccess(String botToken) {
        // 봇 토큰 검증 로직 (필요에 따라 구현)
        // 현재는 단순히 토큰 존재 여부만 확인
        if (!StringUtils.hasText(botToken)) {
            log.warn("Bot request without token");
            // 필요에 따라 예외 발생
            // throw ErrorStatus.UNAUTHORIZED.asControllerException("Bot token required");
        }
    }

    // ===== 봇 전용 응답 DTO =====

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotStatsResponse {
        private String guildId;
        private long activeGroupCount;
        private long activeButtonCount;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class HealthResponse {
        private String status;
        private String service;
        private long timestamp;
    }
}