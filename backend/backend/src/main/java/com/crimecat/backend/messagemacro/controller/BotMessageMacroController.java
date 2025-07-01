package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.domain.Group;
import com.crimecat.backend.messagemacro.domain.GroupItem;
import com.crimecat.backend.messagemacro.dto.ButtonDto;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.repository.GroupItemRepository;
import com.crimecat.backend.messagemacro.repository.GroupRepository;
import com.crimecat.backend.messagemacro.service.MessageMacroService;
import java.util.List;
import java.util.UUID;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/bot/v1/messageMacros")
@RequiredArgsConstructor
@Validated
public class BotMessageMacroController {
    private final MessageMacroService messageMacroService;
    private final GroupRepository groupRepository;
    private final GroupItemRepository groupItemRepository;
    private final GuildRepository guildRepository;
    
    @GetMapping("/groups/{guildSnowflake}")
    public ResponseEntity<List<GroupDto>> getGroups(
        @PathVariable @NonNull String guildSnowflake) {

        log.info("🔍 그룹 목록 조회 - guildSnowflake: {}", guildSnowflake);

        if (!StringUtils.hasText(guildSnowflake)) {
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
        }

        // 길드 존재 여부 확인
        guildRepository.findGuildByGuildSnowflake(guildSnowflake)
            .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asControllerException);

        List<GroupDto> allGroups = messageMacroService.getAllGroups(guildSnowflake);
        return ResponseEntity.ok(allGroups);
    }
    
    @GetMapping("/buttons/{guildSnowflake}/{targetGroupName}")
    public ResponseEntity<?> getGroupButtons(
        @PathVariable @NonNull String guildSnowflake,
        @PathVariable @NonNull String targetGroupName) {

        log.info("🔍 targetGroupName: {}", targetGroupName);

        if (!StringUtils.hasText(guildSnowflake)) {
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
        }

        Guild guild = guildRepository.findGuildByGuildSnowflake(guildSnowflake)
            .orElseThrow(ErrorStatus.GUILD_NOT_FOUND::asControllerException);

        if (!StringUtils.hasText(targetGroupName)) {
            List<GroupDto> allGroups = messageMacroService.getAllGroups(guildSnowflake);
            return ResponseEntity.ok(allGroups);
        }

        Group group = groupRepository.findGroupByGuildSnowflakeAndName(guildSnowflake, targetGroupName)
            .orElseThrow(ErrorStatus.GROUP_NOT_FOUND::asControllerException);

        GroupDto groupDto = messageMacroService.getButtons(group);
        return ResponseEntity.ok(groupDto);
    }


    @GetMapping("/contents/{buttonId}")
    public ResponseEntity<ButtonDto> getButtonContent(
            @PathVariable @NonNull String buttonId) {

        GroupItem groupItemById = groupItemRepository.findGroupItemById(UUID.fromString(buttonId))
                        .orElseThrow(ErrorStatus.BUTTON_ID_NOT_EXISTS::asControllerException);

        ButtonDto contents = messageMacroService.getContents(groupItemById);
        return ResponseEntity.ok(contents);
    }
}