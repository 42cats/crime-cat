package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandDto;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandParameterDto;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandSubcommandDto;
import com.crimecat.backend.messagemacro.dto.AutocompleteOptionDto;
import com.crimecat.backend.messagemacro.dto.ButtonAutomationGroupDto;
import com.crimecat.backend.messagemacro.dto.CommandAutocompleteMetadataDto;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.service.ButtonAutomationService;
import com.crimecat.backend.messagemacro.service.MessageMacroService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 프론트엔드용 자동완성 API 컨트롤러
 * Discord 봇 자동완성 로직을 프론트엔드용으로 포팅
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/autocomplete")
@RequiredArgsConstructor
@Validated
public class AutocompleteController {
    
    private final MessageMacroService messageMacroService;
    private final ButtonAutomationService buttonAutomationService;
    private final GuildRepository guildRepository;
    
    // Guild ID 검증을 위한 패턴 (Discord Snowflake ID는 숫자로만 구성)
    private static final Pattern VALID_GUILD_ID_PATTERN = Pattern.compile("^[0-9]{17,19}$");

    /**
     * 그룹명 자동완성 (버튼 커맨드용)
     * Discord 봇의 groupNames.js 로직을 프론트엔드용으로 이식
     */
    @GetMapping("/{guildId}/group-names")
    public ResponseEntity<List<AutocompleteOptionDto>> getGroupNames(
            @PathVariable String guildId,
            @RequestParam(required = false, defaultValue = "") String q) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        
        // 길드 소유권 검증 (웹 인증 필수)
        validateGuildAccess(webUser, guildId);
        
        try {
            // Discord 봇과 동일한 로직 적용
            List<GroupDto> groups = messageMacroService.getAllGroups(guildId);
            
            String normalizedQuery = Normalizer.normalize(q, Normalizer.Form.NFC).toLowerCase();
            
            List<AutocompleteOptionDto> options = groups.stream()
                .filter(group -> normalizedQuery.isEmpty() || 
                    Normalizer.normalize(group.getName(), Normalizer.Form.NFC).toLowerCase().contains(normalizedQuery))
                .limit(25)
                .map(group -> AutocompleteOptionDto.builder()
                    .name(group.getName())
                    .value(group.getName())
                    .build())
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(options);
            
        } catch (Exception e) {
            log.error("❌ 그룹명 자동완성 오류", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 자동화 버튼 그룹 자동완성 (기능버튼 커맨드용)
     * Discord 봇의 buttonGroups.js 로직을 프론트엔드용으로 이식
     */
    @GetMapping("/{guildId}/button-groups")
    public ResponseEntity<List<AutocompleteOptionDto>> getButtonGroups(
            @PathVariable String guildId,
            @RequestParam(required = false, defaultValue = "") String q) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        
        validateGuildAccess(webUser, guildId);
        
        try {
            // buttonGroups.js 로직 이식
            List<ButtonAutomationGroupDto> groups = buttonAutomationService.getGroups(guildId);
            
            String normalizedQuery = Normalizer.normalize(q, Normalizer.Form.NFC).toLowerCase();
            
            List<AutocompleteOptionDto> options = groups.stream()
                .filter(group -> normalizedQuery.isEmpty() || 
                    Normalizer.normalize(group.getName(), Normalizer.Form.NFC).toLowerCase().contains(normalizedQuery))
                .limit(25)
                .map(group -> {
                    int buttonCount = group.getButtons() != null ? group.getButtons().size() : 0;
                    return AutocompleteOptionDto.builder()
                        .name(group.getName() + " (" + buttonCount + "개 버튼)")
                        .value(group.getId().toString())
                        .build();
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(options);
            
        } catch (Exception e) {
            log.error("❌ 버튼 그룹 자동완성 오류", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 로그 파일명 자동완성 (로그 커맨드용)
     * Discord 봇의 logFileName.js 로직을 프론트엔드용으로 이식
     */
    @GetMapping("/{guildId}/log-files")
    public ResponseEntity<List<AutocompleteOptionDto>> getLogFiles(
            @PathVariable String guildId,
            @RequestParam(required = false, defaultValue = "") String q) {
        
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        
        validateGuildAccess(webUser, guildId);
        
        try {
            // logFileName.js 로직 이식 - 파일시스템에서 엑셀 파일 조회
            List<String> logFiles = getExcelFilesFromFileSystem(guildId);
            
            String normalizedQuery = Normalizer.normalize(q, Normalizer.Form.NFC).toLowerCase();
            
            List<AutocompleteOptionDto> options = logFiles.stream()
                .filter(fileName -> normalizedQuery.isEmpty() || 
                    Normalizer.normalize(fileName, Normalizer.Form.NFC).toLowerCase().contains(normalizedQuery))
                .limit(25)
                .map(fileName -> AutocompleteOptionDto.builder()
                    .name(fileName)
                    .value(fileName)
                    .build())
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(options);
            
        } catch (Exception e) {
            log.error("❌ 로그 파일 자동완성 오류", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 봇 커맨드별 자동완성 메타데이터 제공
     * Redis 캐시된 봇 커맨드 정보에서 자동완성 정보 추출
     */
    @GetMapping("/commands/metadata")
    public ResponseEntity<List<CommandAutocompleteMetadataDto>> getAutocompleteMetadata() {
        
        try {
            // 기존 BotCommandsRedisService 활용
            List<BotCommandDto> botCommands = buttonAutomationService.getBotCommands();
            
            // 자동완성 메타데이터 추출 및 매핑
            List<CommandAutocompleteMetadataDto> metadata = botCommands.stream()
                .flatMap(this::extractAutocompleteParameters)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(metadata);
            
        } catch (Exception e) {
            log.error("❌ 자동완성 메타데이터 조회 오류", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * 길드 접근 권한 검증
     */
    private void validateGuildAccess(WebUser webUser, String guildId) {
        if (!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildId, webUser.getDiscordUserSnowflake())) {
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
        }
    }

    /**
     * 봇 커맨드에서 자동완성 파라미터 추출
     */
    private Stream<CommandAutocompleteMetadataDto> extractAutocompleteParameters(BotCommandDto command) {
        if (command.getSubcommands() == null) {
            return Stream.empty();
        }
        
        return command.getSubcommands().entrySet().stream()
            .flatMap(entry -> {
                String subcommandName = entry.getKey();
                BotCommandSubcommandDto subcommand = entry.getValue();
                
                if (subcommand.getParameters() == null) {
                    return Stream.empty();
                }
                
                return subcommand.getParameters().stream()
                    .filter(param -> "string".equals(param.getType()) && param.getChoices() == null)
                    .map(param -> CommandAutocompleteMetadataDto.builder()
                        .commandName(command.getName())
                        .subcommand(subcommandName)
                        .parameterName(param.getName())
                        .apiEndpoint(mapParameterToEndpoint(param.getName()))
                        .hasMultiSelect(param.getName().endsWith("s")) // groupnames vs groupname
                        .build());
            });
    }

    /**
     * 파라미터명을 API 엔드포인트로 매핑
     */
    private String mapParameterToEndpoint(String parameterName) {
        Map<String, String> mapping = Map.of(
            "groupname", "/api/v1/autocomplete/{guildId}/group-names",
            "groupnames", "/api/v1/autocomplete/{guildId}/group-names",
            "자동화_그룹", "/api/v1/autocomplete/{guildId}/button-groups",
            "파일명", "/api/v1/autocomplete/{guildId}/log-files"
        );
        
        return mapping.getOrDefault(parameterName, "");
    }

    /**
     * Guild ID 유효성 검증 (보안: Path Traversal 방지)
     */
    private boolean isValidGuildId(String guildId) {
        return guildId != null && VALID_GUILD_ID_PATTERN.matcher(guildId).matches();
    }

    /**
     * 파일시스템에서 엑셀 파일 목록 조회
     * Discord 봇의 logFileName.js와 동일한 로직
     * 보안: Path Traversal 취약점 방지를 위한 검증 추가
     */
    private List<String> getExcelFilesFromFileSystem(String guildId) {
        try {
            // Guild ID 유효성 검증 (보안)
            if (!isValidGuildId(guildId)) {
                log.warn("⚠️ 유효하지 않은 guildId 감지: {}", guildId);
                return new ArrayList<>();
            }
            
            // 안전한 경로 구성 (Path Traversal 방지)
            Path logFolderPath = Paths.get(System.getProperty("user.dir"), "dat", guildId);
            File logFolder = logFolderPath.toFile();
            
            // 경로 정규화 및 검증
            String normalizedPath = logFolder.getCanonicalPath();
            String expectedBasePath = Paths.get(System.getProperty("user.dir"), "dat").toFile().getCanonicalPath();
            
            if (!normalizedPath.startsWith(expectedBasePath)) {
                log.error("🚨 Path Traversal 시도 감지: guildId={}, path={}", guildId, normalizedPath);
                return new ArrayList<>();
            }
            
            if (!logFolder.exists() || !logFolder.isDirectory()) {
                log.warn("⚠️ 로그 폴더가 존재하지 않음: {}", normalizedPath);
                return new ArrayList<>();
            }
            
            File[] files = logFolder.listFiles((dir, name) -> 
                name.toLowerCase().endsWith(".xlsx") || name.toLowerCase().endsWith(".xls"));
            
            if (files == null) {
                return new ArrayList<>();
            }
            
            return Arrays.stream(files)
                .map(file -> {
                    String fileName = file.getName();
                    // 확장자 제거 (Discord 봇과 동일)
                    int lastDot = fileName.lastIndexOf('.');
                    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
                })
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("❌ 엑셀 파일 목록 조회 실패", e);
            return new ArrayList<>();
        }
    }
}