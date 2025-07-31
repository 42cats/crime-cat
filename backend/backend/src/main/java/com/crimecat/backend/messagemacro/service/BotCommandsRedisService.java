package com.crimecat.backend.messagemacro.service;

import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandDto;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandParameterDto;
import com.crimecat.backend.messagemacro.controller.ButtonAutomationController.BotCommandChoiceDto;
import com.crimecat.backend.utils.RedisCacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Discord 봇 커맨드 Redis 캐시 서비스
 * Bot CommandsCacheManager에서 저장한 커맨드 메타데이터를 조회
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotCommandsRedisService {

    private final RedisCacheService redisCacheService;
    private final ObjectMapper objectMapper;
    
    private static final String BOT_COMMANDS_CACHE_KEY = "bot:commands:metadata";

    /**
     * Redis에서 봇 커맨드 목록 조회
     * @return 봇 커맨드 DTO 목록
     */
    @SuppressWarnings("unchecked")
    public List<BotCommandDto> getBotCommandsFromCache() {
        try {
            log.debug("Redis에서 봇 커맨드 캐시 조회 시작: {}", BOT_COMMANDS_CACHE_KEY);
            
            // Redis에서 JSON 문자열로 저장된 캐시 데이터 조회
            Optional<Map> cachedDataRaw = redisCacheService.load(BOT_COMMANDS_CACHE_KEY, Map.class);

            if (cachedDataRaw.isEmpty()) {
                log.warn("봇 커맨드 캐시가 존재하지 않습니다. 빈 목록을 반환합니다.");
                return new ArrayList<>();
            }

            Map<String, Object> cacheMap = (Map<String, Object>) cachedDataRaw.get();
            log.info("캐시된 봇 커맨드 메타데이터 조회 성공 - 마지막 업데이트: {}, 커맨드 수: {}", 
                    cacheMap.get("lastUpdated"), cacheMap.get("commandCount"));

            // commands 배열 추출
            Object commandsObj = cacheMap.get("commands");
            if (commandsObj == null) {
                log.warn("캐시 데이터에 commands 배열이 없습니다.");
                return new ArrayList<>();
            }

            // ObjectMapper를 사용해 안전하게 변환
            String commandsJson = objectMapper.writeValueAsString(commandsObj);
            List<Map<String, Object>> commandsList = objectMapper.readValue(
                commandsJson, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
            );

            List<BotCommandDto> botCommands = new ArrayList<>();
            
            for (Map<String, Object> cmdMap : commandsList) {
                try {
                    BotCommandDto command = convertToCommandDto(cmdMap);
                    botCommands.add(command);
                } catch (Exception e) {
                    log.warn("커맨드 변환 실패: {}", cmdMap.get("name"), e);
                }
            }

            log.info("봇 커맨드 변환 완료: {}개", botCommands.size());
            return botCommands;

        } catch (Exception e) {
            log.error("봇 커맨드 캐시 조회 중 오류 발생", e);
            return new ArrayList<>();
        }
    }

    /**
     * 캐시 데이터를 BotCommandDto로 변환
     */
    @SuppressWarnings("unchecked")
    private BotCommandDto convertToCommandDto(Map<String, Object> cmdMap) {
        String name = (String) cmdMap.get("name");
        String description = (String) cmdMap.get("description");
        String type = (String) cmdMap.get("type");
        String category = (String) cmdMap.get("category");

        // 파라미터 변환
        List<BotCommandParameterDto> parameters = new ArrayList<>();
        Object parametersObj = cmdMap.get("parameters");
        
        if (parametersObj instanceof List) {
            List<Map<String, Object>> paramsList = (List<Map<String, Object>>) parametersObj;
            
            for (Map<String, Object> paramMap : paramsList) {
                BotCommandParameterDto parameter = convertToParameterDto(paramMap);
                parameters.add(parameter);
            }
        }

        return BotCommandDto.builder()
            .name(name)
            .description(description != null ? description : "설명 없음")
            .type(type != null ? type : "slash")
            .category(category != null ? category : "general")
            .parameters(parameters)
            .build();
    }

    /**
     * 파라미터 맵을 BotCommandParameterDto로 변환
     */
    @SuppressWarnings("unchecked")
    private BotCommandParameterDto convertToParameterDto(Map<String, Object> paramMap) {
        String name = (String) paramMap.get("name");
        String type = (String) paramMap.get("type");
        String description = (String) paramMap.get("description");
        Boolean required = (Boolean) paramMap.get("required");

        // choices 변환
        List<BotCommandChoiceDto> choices = null;
        Object choicesObj = paramMap.get("choices");
        
        if (choicesObj instanceof List) {
            List<Map<String, Object>> choicesList = (List<Map<String, Object>>) choicesObj;
            choices = new ArrayList<>();
            
            for (Map<String, Object> choiceMap : choicesList) {
                String choiceName = (String) choiceMap.get("name");
                String choiceValue = (String) choiceMap.get("value");
                choices.add(BotCommandChoiceDto.builder()
                    .name(choiceName)
                    .value(choiceValue)
                    .build());
            }
        }

        return BotCommandParameterDto.builder()
            .name(name != null ? name : "unknown")
            .type(type != null ? type : "string")
            .description(description != null ? description : "설명 없음")
            .required(required != null ? required : false)
            .choices(choices)
            .build();
    }

    /**
     * 캐시 상태 확인
     * @return 캐시 존재 여부
     */
    @SuppressWarnings("unchecked")
    public boolean isCacheAvailable() {
        try {
            Optional<Map> cachedData = redisCacheService.load(BOT_COMMANDS_CACHE_KEY, Map.class);
            return cachedData.isPresent();
        } catch (Exception e) {
            log.error("캐시 상태 확인 중 오류", e);
            return false;
        }
    }

    /**
     * 캐시 통계 정보 조회
     * @return 캐시 메타데이터
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getCacheStats() {
        try {
            Optional<Map> cachedDataRaw = redisCacheService.load(BOT_COMMANDS_CACHE_KEY, Map.class);
            
            if (cachedDataRaw.isPresent()) {
                Map<String, Object> data = (Map<String, Object>) cachedDataRaw.get();
                return Map.of(
                    "exists", true,
                    "lastUpdated", data.get("lastUpdated"),
                    "commandCount", data.get("commandCount"),
                    "botVersion", data.get("botVersion")
                );
            } else {
                return Map.of("exists", false);
            }
        } catch (Exception e) {
            log.error("캐시 통계 조회 실패", e);
            return Map.of("exists", false, "error", e.getMessage());
        }
    }
}