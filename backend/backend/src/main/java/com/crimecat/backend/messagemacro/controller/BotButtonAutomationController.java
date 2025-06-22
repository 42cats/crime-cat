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
@RequestMapping("/bot/v1/automations")
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
            @PathVariable @NonNull String guildId) {
        
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
            @PathVariable @NonNull UUID buttonId) {
        
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
            @PathVariable @NonNull String guildId) {
        
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
     * 봇용 - 버튼 자동화 실행
     * 디스코드 봇에서 버튼 클릭 시 호출되는 엔드포인트
     */
    @PostMapping("/execute/{buttonId}")
    public ResponseEntity<ButtonExecuteResponse> executeButtonAutomation(
            @PathVariable @NonNull String buttonId,
            @RequestBody @NonNull ButtonExecuteRequest request) {
        
        log.info("Bot executing button automation: {} for user: {} in guild: {}", 
                buttonId, request.getUserId(), request.getGuildId());
        
        try {
            // UUID 변환
            UUID buttonUuid = UUID.fromString(buttonId);
            
            // 버튼 실행 로직 (서비스에서 구현 필요)
            boolean success = buttonAutomationService.executeButtonAutomation(buttonUuid, request);
            
            ButtonExecuteResponse response = ButtonExecuteResponse.builder()
                    .success(success)
                    .buttonId(buttonId)
                    .executedAt(System.currentTimeMillis())
                    .message(success ? "버튼 자동화가 성공적으로 실행되었습니다." : "버튼 자동화 실행에 실패했습니다.")
                    .build();
            
            log.info("Button automation execution result: {} for button: {}", success, buttonId);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid button ID format: {}", buttonId);
            throw ErrorStatus.BUTTON_ID_NOT_FOUND.asControllerException();
        } catch (Exception e) {
            log.error("Error executing button automation: {} - {}", buttonId, e.getMessage());
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
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
    // 봇 검증은 Spring Security 필터에서 처리됨

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

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ButtonExecuteRequest {
        private String userId;
        private String guildId;
        private String channelId;
        private String messageId;
        private String timestamp;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ButtonExecuteResponse {
        private boolean success;
        private String buttonId;
        private long executedAt;
        private String message;
        private Integer cooldownRemaining;
        private java.util.List<String> executedActions;
    }
}