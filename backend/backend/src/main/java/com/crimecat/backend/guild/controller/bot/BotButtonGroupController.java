package com.crimecat.backend.guild.controller.bot;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.ButtonAutomationDto;
import com.crimecat.backend.messagemacro.dto.ButtonAutomationGroupDto;
import com.crimecat.backend.messagemacro.service.ButtonAutomationService;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Discord Bot용 버튼 그룹 컨트롤러
 * 봇이 버튼 그룹 정보를 조회할 때 사용
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/button-groups")
public class BotButtonGroupController {

    private final ButtonAutomationService buttonAutomationService;
    private final GuildRepository guildRepository;

    /**
     * 길드의 모든 버튼 그룹 이름 목록 조회 (오토컴플릿용)
     * 
     * @param guildSnowflake Discord 길드 ID
     * @return 버튼 그룹 목록 (id, name, buttonCount 포함)
     */
    @GetMapping
    public ResponseEntity<MessageDto<List<Map<String, Object>>>> getButtonGroups(@PathVariable String guildSnowflake) {
        log.info("🤖 [Bot API - 버튼 그룹 목록 조회] guildId={}", guildSnowflake);
        
        try {
            // 길드 존재 여부 확인
            Guild guild = guildRepository.findBySnowflake(guildSnowflake)
                    .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asDomainException);
            
            // 활성화된 버튼 그룹 목록 조회
            List<ButtonAutomationGroupDto> groups = buttonAutomationService.getGroups(guildSnowflake);
            
            // 봇 API 응답 형식으로 변환
            List<Map<String, Object>> buttonGroups = groups.stream()
                    .filter(group -> group.getIsActive()) // 활성화된 그룹만
                    .map(group -> {
                        Map<String, Object> groupMap = new HashMap<>();
                        groupMap.put("id", group.getId().toString());
                        groupMap.put("name", group.getName());
                        groupMap.put("buttonCount", group.getButtons() != null ? group.getButtons().size() : 0);
                        groupMap.put("isActive", group.getIsActive());
                        return groupMap;
                    })
                    .collect(Collectors.toList());
            
            log.info("✅ [Bot API - 버튼 그룹 목록 조회 성공] guildId={}, 그룹 수={}", guildSnowflake, buttonGroups.size());
            
            return ResponseEntity.ok(new MessageDto<>("버튼 그룹 목록 조회 성공", buttonGroups));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 버튼 그룹 목록 조회 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw new RuntimeException("버튼 그룹 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 특정 버튼 그룹의 상세 정보 조회
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param groupId 버튼 그룹 ID
     * @return 버튼 그룹 상세 정보
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<MessageDto<Map<String, Object>>> getButtonGroup(
            @PathVariable String guildSnowflake,
            @PathVariable String groupId) {
        
        log.info("🤖 [Bot API - 버튼 그룹 상세 조회] guildId={}, groupId={}", guildSnowflake, groupId);
        
        try {
            // 길드 존재 여부 확인
            Guild guild = guildRepository.findBySnowflake(guildSnowflake)
                    .orElseThrow(() -> ErrorStatus.GUILD_NOT_FOUND.asDomainException());
            
            // 그룹 ID를 UUID로 변환
            UUID groupUuid;
            try {
                groupUuid = UUID.fromString(groupId);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("유효하지 않은 그룹 ID 형식입니다: " + groupId);
            }
            
            // 버튼 그룹 상세 정보 조회
            ButtonAutomationGroupDto group = buttonAutomationService.getGroupById(groupUuid)
                    .orElseThrow(() -> new RuntimeException("버튼 그룹을 찾을 수 없습니다: " + groupId));
            
            // 길드 ID 검증
            if (!group.getGuildId().equals(guildSnowflake)) {
                throw new RuntimeException("이 길드에 속하지 않은 버튼 그룹입니다");
            }
            
            // 봇 API 응답 형식으로 변환
            Map<String, Object> buttonGroup = new HashMap<>();
            buttonGroup.put("id", group.getId().toString());
            buttonGroup.put("name", group.getName());
            buttonGroup.put("description", group.getSettings() != null ? group.getSettings() : "");
            buttonGroup.put("buttonCount", group.getButtons() != null ? group.getButtons().size() : 0);
            buttonGroup.put("isActive", group.getIsActive());
            
            // 버튼 목록 변환
            if (group.getButtons() != null) {
                List<Map<String, Object>> buttons = group.getButtons().stream()
                        .map(button -> {
                            Map<String, Object> buttonMap = new HashMap<>();
                            buttonMap.put("id", button.getId().toString());
                            buttonMap.put("label", button.getButtonLabel());
                            buttonMap.put("isActive", button.getIsActive());
                            return buttonMap;
                        })
                        .collect(Collectors.toList());
                buttonGroup.put("buttons", buttons);
            } else {
                buttonGroup.put("buttons", new ArrayList<>());
            }
            
            log.info("✅ [Bot API - 버튼 그룹 상세 조회 성공] guildId={}, groupId={}", guildSnowflake, groupId);
            
            return ResponseEntity.ok(new MessageDto<>("버튼 그룹 조회 성공", buttonGroup));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 버튼 그룹 상세 조회 실패] guildId={}, groupId={}, error={}", 
                     guildSnowflake, groupId, e.getMessage(), e);
            throw new RuntimeException("버튼 그룹 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 버튼 그룹을 Discord 채널에 전송
     * 
     * @param guildSnowflake Discord 길드 ID
     * @param groupId 버튼 그룹 ID
     * @param sendRequest 전송 요청 데이터
     * @return 전송 결과
     */
    @PostMapping("/{groupId}/send")
    public ResponseEntity<MessageDto<Map<String, Object>>> sendButtonGroup(
            @PathVariable String guildSnowflake,
            @PathVariable String groupId,
            @RequestBody Map<String, Object> sendRequest) {
        
        String channelId = (String) sendRequest.get("channelId");
        String customMessage = (String) sendRequest.get("customMessage");
        String senderId = (String) sendRequest.get("senderId");
        
        log.info("🤖 [Bot API - 버튼 그룹 전송] guildId={}, groupId={}, channelId={}", 
                guildSnowflake, groupId, channelId);
        
        try {
            // 길드 존재 여부 확인
            Guild guild = guildRepository.findBySnowflake(guildSnowflake)
                    .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asDomainException);
            
            // 그룹 ID를 UUID로 변환
            UUID groupUuid;
            try {
                groupUuid = UUID.fromString(groupId);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("유효하지 않은 그룹 ID 형식입니다: " + groupId);
            }
            
            // 버튼 그룹 정보 조회
            ButtonAutomationGroupDto group = buttonAutomationService.getGroupById(groupUuid)
                    .orElseThrow(() -> new RuntimeException("버튼 그룹을 찾을 수 없습니다: " + groupId));
            
            // 길드 ID 검증
            if (!group.getGuildId().equals(guildSnowflake)) {
                throw new RuntimeException("이 길드에 속하지 않은 버튼 그룹입니다");
            }
            
            // 활성화 상태 확인
            if (!group.getIsActive()) {
                throw new RuntimeException("비활성화된 버튼 그룹입니다");
            }
            
            // 활성화된 버튼 수 계산
            int activeButtonCount = 0;
            if (group.getButtons() != null) {
                activeButtonCount = (int) group.getButtons().stream()
                        .filter(ButtonAutomationDto::getIsActive)
                        .count();
            }
            
            if (activeButtonCount == 0) {
                throw new RuntimeException("활성화된 버튼이 없습니다");
            }
            
            // Discord 봇이 실제 메시지 전송을 처리하므로, 여기서는 전송 정보만 반환
            // messageId는 봇이 전송 후 생성됨 (여기서는 임시 ID 반환)
            String messageId = "pending_" + System.currentTimeMillis();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("messageId", messageId);
            result.put("channelId", channelId);
            result.put("buttonCount", activeButtonCount);
            result.put("groupId", groupId);
            result.put("sentAt", System.currentTimeMillis());
            
            // 전송 로그 기록 (필요한 경우)
            log.info("✅ [Bot API - 버튼 그룹 전송 준비 완료] guildId={}, groupId={}, channelId={}, activeButtons={}", 
                    guildSnowflake, groupId, channelId, activeButtonCount);
            
            return ResponseEntity.ok(new MessageDto<>("버튼 그룹 전송 성공", result));
            
        } catch (Exception e) {
            log.error("❌ [Bot API - 버튼 그룹 전송 실패] guildId={}, groupId={}, error={}", 
                     guildSnowflake, groupId, e.getMessage(), e);
            throw new RuntimeException("버튼 그룹 전송 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}