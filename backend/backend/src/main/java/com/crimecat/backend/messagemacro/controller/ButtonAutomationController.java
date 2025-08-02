package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.*;
import com.crimecat.backend.messagemacro.service.ButtonAutomationService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/automations")
@RequiredArgsConstructor
@Validated
public class ButtonAutomationController {
    
    private final ButtonAutomationService buttonAutomationService;
    private final GuildRepository guildRepository;

    // ===== 그룹 관리 엔드포인트 =====

    @GetMapping("/{guildId}/groups")
    public ResponseEntity<List<ButtonAutomationGroupDto>> getGroups(@PathVariable @NonNull String guildId) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        
        // 길드 권한 확인
        validateGuildAccess(webUser, guildId);
        
        List<ButtonAutomationGroupDto> groups = buttonAutomationService.getGroups(guildId);
        log.info("Retrieved {} automation groups for guild: {} by user: {}", 
                groups.size(), guildId, webUser.getId());
        
        return ResponseEntity.ok(groups);
    }

    @PostMapping("/{guildId}/groups")
    public ResponseEntity<ButtonAutomationGroupDto> createGroup(
            @PathVariable @NonNull String guildId,
            @Valid @RequestBody ButtonAutomationGroupRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        ButtonAutomationGroupDto createdGroup = buttonAutomationService.createGroup(guildId, request);
        log.info("Created automation group: {} for guild: {} by user: {}", 
                createdGroup.getId(), guildId, webUser.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdGroup);
    }

    @PutMapping("/{guildId}/groups/{groupId}")
    public ResponseEntity<ButtonAutomationGroupDto> updateGroup(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID groupId,
            @Valid @RequestBody ButtonAutomationGroupRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        ButtonAutomationGroupDto updatedGroup = buttonAutomationService.updateGroup(groupId, request);
        log.info("Updated automation group: {} for guild: {} by user: {}", 
                groupId, guildId, webUser.getId());
        
        return ResponseEntity.ok(updatedGroup);
    }

    @DeleteMapping("/{guildId}/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID groupId) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        buttonAutomationService.deleteGroup(groupId);
        log.info("Deleted automation group: {} for guild: {} by user: {}", 
                groupId, guildId, webUser.getId());
        
        return ResponseEntity.noContent().build();
    }

    // ===== 버튼 관리 엔드포인트 =====

    @GetMapping("/{guildId}/buttons")
    public ResponseEntity<List<ButtonAutomationDto>> getButtons(@PathVariable @NonNull String guildId) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        List<ButtonAutomationDto> buttons = buttonAutomationService.getButtons(guildId);
        log.info("Retrieved {} automation buttons for guild: {} by user: {}", 
                buttons.size(), guildId, webUser.getId());
        
        return ResponseEntity.ok(buttons);
    }

    @GetMapping("/{guildId}/groups/{groupId}/buttons")
    public ResponseEntity<List<ButtonAutomationDto>> getButtonsByGroup(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID groupId) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        List<ButtonAutomationDto> buttons = buttonAutomationService.getButtonsByGroup(groupId);
        log.info("Retrieved {} automation buttons for group: {} by user: {}", 
                buttons.size(), groupId, webUser.getId());
        
        return ResponseEntity.ok(buttons);
    }

    @GetMapping("/{guildId}/buttons/{buttonId}")
    public ResponseEntity<ButtonAutomationDto> getButton(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID buttonId) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        ButtonAutomationDto button = buttonAutomationService.getButtonById(buttonId)
                .orElseThrow(ErrorStatus.BUTTON_ID_NOT_FOUND::asControllerException);
        
        return ResponseEntity.ok(button);
    }

    @PostMapping("/{guildId}/buttons")
    public ResponseEntity<ButtonAutomationDto> createButton(
            @PathVariable @NonNull String guildId,
            @Valid @RequestBody ButtonAutomationRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        ButtonAutomationDto createdButton = buttonAutomationService.createButton(guildId, request);
        log.info("Created automation button: {} for guild: {} by user: {}", 
                createdButton.getId(), guildId, webUser.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(createdButton);
    }

    @PutMapping("/{guildId}/buttons/{buttonId}")
    public ResponseEntity<ButtonAutomationDto> updateButton(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID buttonId,
            @Valid @RequestBody ButtonAutomationRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        ButtonAutomationDto updatedButton = buttonAutomationService.updateButton(buttonId, request);
        log.info("Updated automation button: {} for guild: {} by user: {}", 
                buttonId, guildId, webUser.getId());
        
        return ResponseEntity.ok(updatedButton);
    }

    @DeleteMapping("/{guildId}/buttons/{buttonId}")
    public ResponseEntity<Void> deleteButton(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID buttonId) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        buttonAutomationService.deleteButton(buttonId);
        log.info("Deleted automation button: {} for guild: {} by user: {}", 
                buttonId, guildId, webUser.getId());
        
        return ResponseEntity.noContent().build();
    }

    // ===== 복사 엔드포인트 =====

    @PostMapping("/{guildId}/groups/{groupId}/copy")
    public ResponseEntity<ButtonAutomationGroupDto> copyGroup(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID groupId,
            @Valid @RequestBody(required = false) CopyGroupRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        String newName = request != null ? request.getNewName() : null;
        ButtonAutomationGroupDto copiedGroup = buttonAutomationService.copyGroup(groupId, guildId, newName);
        
        log.info("Copied automation group: {} -> {} for guild: {} by user: {}", 
                groupId, copiedGroup.getId(), guildId, webUser.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(copiedGroup);
    }

    @PostMapping("/{guildId}/buttons/{buttonId}/copy")
    public ResponseEntity<ButtonAutomationDto> copyButton(
            @PathVariable @NonNull String guildId,
            @PathVariable @NonNull UUID buttonId,
            @Valid @RequestBody(required = false) CopyButtonRequestDto request) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        UUID targetGroupId = request != null ? request.getTargetGroupId() : null;
        String newLabel = request != null ? request.getNewLabel() : null;
        
        ButtonAutomationDto copiedButton = buttonAutomationService.copyButton(buttonId, targetGroupId, newLabel);
        
        log.info("Copied automation button: {} -> {} for guild: {} by user: {}", 
                buttonId, copiedButton.getId(), guildId, webUser.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(copiedButton);
    }

    // ===== 봇 커맨드 스캔 엔드포인트 =====

    @GetMapping("/bot-commands")
    public ResponseEntity<BotCommandsResponse> getBotCommands() {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        
        try {
            List<BotCommandDto> commands = buttonAutomationService.getBotCommands();
            
            BotCommandsResponse response = BotCommandsResponse.builder()
                    .success(true)
                    .commands(commands)
                    .count(commands.size())
                    .build();
            
            log.info("Retrieved {} bot commands for user: {}", commands.size(), webUser.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to retrieve bot commands for user: {}", webUser.getId(), e);
            
            BotCommandsResponse errorResponse = BotCommandsResponse.builder()
                    .success(false)
                    .commands(List.of())
                    .error("봇 커맨드를 불러올 수 없습니다: " + e.getMessage())
                    .build();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 자동완성 메타데이터가 포함된 향상된 봇 커맨드 조회
     * Discord 봇 커맨드 + 자동완성 지원 정보 통합 제공
     */
    @GetMapping("/{guildId}/bot-commands-enhanced")
    public ResponseEntity<EnhancedBotCommandsResponse> getEnhancedBotCommands(@PathVariable @NonNull String guildId) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        log.info("🚀 Enhanced bot commands requested - guildId: {}, user: {}", guildId, webUser.getId());
        
        // 길드 권한 확인
        validateGuildAccess(webUser, guildId);
        
        try {
            // 1. 기존 봇 커맨드 조회
            List<BotCommandDto> commands = buttonAutomationService.getBotCommands();
            log.info("📦 Retrieved {} bot commands", commands.size());
            
            // 2. 자동완성 메타데이터와 통합
            List<EnhancedBotCommandDto> enhancedCommands = commands.stream()
                .map(this::enhanceWithAutocompleteMetadata)
                .toList();
            
            // 3. 자동완성 통계 생성
            AutocompleteSummaryDto summary = createAutocompleteSummary(enhancedCommands);
            
            EnhancedBotCommandsResponse response = EnhancedBotCommandsResponse.builder()
                .success(true)
                .commands(enhancedCommands)
                .count(enhancedCommands.size())
                .autocompleteSummary(summary)
                .build();
            
            log.info("✅ Enhanced bot commands response: {} commands, {} with autocomplete", 
                enhancedCommands.size(), summary.getCommandsWithAutocomplete());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to retrieve enhanced bot commands for user: {}", webUser.getId(), e);
            
            EnhancedBotCommandsResponse errorResponse = EnhancedBotCommandsResponse.builder()
                .success(false)
                .commands(List.of())
                .count(0)
                .message("향상된 봇 커맨드를 불러올 수 없습니다: " + e.getMessage())
                .build();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ===== 통계 엔드포인트 =====

    @GetMapping("/{guildId}/stats")
    public ResponseEntity<StatsResponse> getStats(@PathVariable @NonNull String guildId) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        validateGuildAccess(webUser, guildId);
        
        long groupCount = buttonAutomationService.countActiveGroups(guildId);
        long buttonCount = buttonAutomationService.countActiveButtons(guildId);
        
        StatsResponse stats = StatsResponse.builder()
                .groupCount(groupCount)
                .buttonCount(buttonCount)
                .build();
        
        return ResponseEntity.ok(stats);
    }

    // ===== 유틸리티 메서드 =====

    private void validateGuildAccess(WebUser webUser, String guildId) {
        boolean hasAccess = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildId, webUser.getDiscordUserSnowflake());
        if (!hasAccess) {
            throw ErrorStatus.FORBIDDEN.asControllerException();
        }
    }

    /**
     * 기본 봇 커맨드를 자동완성 메타데이터가 포함된 향상된 커맨드로 변환
     */
    private EnhancedBotCommandDto enhanceWithAutocompleteMetadata(BotCommandDto command) {
        // 서브커맨드 변환
        var enhancedSubcommands = command.getSubcommands() != null ? 
            command.getSubcommands().entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                    java.util.Map.Entry::getKey,
                    entry -> enhanceSubcommand(entry.getValue())
                )) : 
            java.util.Map.<String, EnhancedBotCommandSubcommandDto>of();

        // 자동완성 지원 통계 계산
        int totalAutocompleteParams = enhancedSubcommands.values().stream()
            .mapToInt(EnhancedBotCommandSubcommandDto::getAutocompleteParameterCount)
            .sum();

        return EnhancedBotCommandDto.builder()
            .name(command.getName())
            .description(command.getDescription())
            .type(command.getType())
            .category(command.getCategory())
            .isCacheCommand(true) // 기본값으로 설정
            .subcommands(enhancedSubcommands)
            .hasAutocompleteSupport(totalAutocompleteParams > 0)
            .totalAutocompleteParameters(totalAutocompleteParams)
            .build();
    }

    /**
     * 서브커맨드를 자동완성 메타데이터가 포함된 향상된 서브커맨드로 변환
     */
    private EnhancedBotCommandSubcommandDto enhanceSubcommand(BotCommandSubcommandDto subcommand) {
        var enhancedParameters = subcommand.getParameters() != null ?
            subcommand.getParameters().stream()
                .map(this::enhanceParameter)
                .toList() :
            List.<EnhancedBotCommandParameterDto>of();

        int autocompleteCount = (int) enhancedParameters.stream()
            .mapToLong(param -> param.isHasAutocomplete() ? 1 : 0)
            .sum();

        return EnhancedBotCommandSubcommandDto.builder()
            .name(subcommand.getName())
            .description(subcommand.getDescription())
            .parameters(enhancedParameters)
            .autocompleteParameterCount(autocompleteCount)
            .build();
    }

    /**
     * 파라미터를 자동완성 메타데이터가 포함된 향상된 파라미터로 변환
     */
    private EnhancedBotCommandParameterDto enhanceParameter(BotCommandParameterDto parameter) {
        // 자동완성 지원 파라미터 매핑
        boolean hasAutocomplete = isAutocompleteSupported(parameter.getName());
        boolean isMultiSelect = parameter.getName().equals("groupnames");
        String autocompleteType = getAutocompleteType(parameter.getName());
        String autocompleteEndpoint = getAutocompleteEndpoint(parameter.getName());

        // 선택지 변환
        var choices = parameter.getChoices() != null ?
            parameter.getChoices().stream()
                .map(choice -> ParameterChoiceDto.builder()
                    .name(choice.getName())
                    .value(choice.getValue())
                    .build())
                .toList() :
            List.<ParameterChoiceDto>of();

        return EnhancedBotCommandParameterDto.builder()
            .name(parameter.getName())
            .description(parameter.getDescription())
            .type(parameter.getType())
            .required(parameter.required)
            .choices(choices)
            .hasAutocomplete(hasAutocomplete)
            .isMultiSelect(isMultiSelect)
            .autocompleteType(autocompleteType)
            .autocompleteEndpoint(autocompleteEndpoint)
            .build();
    }

    /**
     * 파라미터명으로 자동완성 지원 여부 확인
     */
    private boolean isAutocompleteSupported(String parameterName) {
        return List.of("groupname", "groupnames", "자동화_그룹", "파일명").contains(parameterName);
    }

    /**
     * 파라미터명으로 자동완성 타입 조회
     */
    private String getAutocompleteType(String parameterName) {
        return switch (parameterName) {
            case "groupname", "groupnames" -> "group-names";
            case "자동화_그룹" -> "button-groups";
            case "파일명" -> "log-files";
            default -> null;
        };
    }

    /**
     * 파라미터명으로 자동완성 엔드포인트 조회
     */
    private String getAutocompleteEndpoint(String parameterName) {
        String type = getAutocompleteType(parameterName);
        return type != null ? "/api/v1/autocomplete/{guildId}/" + type : null;
    }

    /**
     * 자동완성 통계 생성
     */
    private AutocompleteSummaryDto createAutocompleteSummary(List<EnhancedBotCommandDto> commands) {
        int totalCommands = commands.size();
        int commandsWithAutocomplete = (int) commands.stream()
            .mapToLong(cmd -> cmd.isHasAutocompleteSupport() ? 1 : 0)
            .sum();
        int totalAutocompleteParameters = commands.stream()
            .mapToInt(EnhancedBotCommandDto::getTotalAutocompleteParameters)
            .sum();
        
        List<String> supportedTypes = List.of("group-names", "button-groups", "log-files");

        return AutocompleteSummaryDto.builder()
            .totalCommands(totalCommands)
            .commandsWithAutocomplete(commandsWithAutocomplete)
            .totalAutocompleteParameters(totalAutocompleteParameters)
            .supportedAutocompleteTypes(supportedTypes)
            .build();
    }

    // ===== 응답 DTO =====

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatsResponse {
        private long groupCount;
        private long buttonCount;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotCommandsResponse {
        private boolean success;
        private List<BotCommandDto> commands;
        private int count;
        private String error;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotCommandDto {
        private String name;
        private String description;
        private String type; // 'slash' or 'prefix'
        private String category; // 커맨드 카테고리 (예: 'utility', 'moderation')
        private List<BotCommandParameterDto> parameters; // 하위 호환성을 위한 flat 구조
        private java.util.Map<String, BotCommandSubcommandDto> subcommands; // 새로운 서브커맨드 구조
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotCommandSubcommandDto {
        private String name;
        private String description;
        private List<BotCommandParameterDto> parameters;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotCommandParameterDto {
        private String name;
        private String type; // 'string', 'number', 'boolean', 'user', 'channel', 'role'
        private String description;
        private boolean required;
        private List<BotCommandChoiceDto> choices;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BotCommandChoiceDto {
        private String name;
        private String value;
    }

    // ===== 복사 요청 DTO =====

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CopyGroupRequestDto {
        private String newName;  // 선택사항, null이면 자동 생성 ("원본명 복사본")
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CopyButtonRequestDto {
        private UUID targetGroupId;  // 선택사항, null이면 원본과 동일 그룹
        private String newLabel;     // 선택사항, null이면 자동 생성 ("원본명 복사본")
    }
}