package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.domain.Group;
import com.crimecat.backend.messagemacro.domain.GroupItem;
import com.crimecat.backend.messagemacro.dto.BotGroupResponseDto;
import com.crimecat.backend.messagemacro.dto.ButtonDto;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.repository.GroupItemRepository;
import com.crimecat.backend.messagemacro.repository.GroupRepository;
import com.crimecat.backend.messagemacro.service.MessageMacroService;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/bot/v1/messageMacros")
@RequiredArgsConstructor
@Validated
public class BotMessageMacroController {
    private final MessageMacroService messageMacroService;
    private final GroupRepository groupRepository;
    private final GroupItemRepository groupItemRepository;

    @GetMapping("/buttons/{guildSnowflake}/{targetGroupName}")
    public ResponseEntity<GroupDto> getGroupButton(
            @PathVariable @NonNull String guildSnowflake,
            @PathVariable @NonNull String targetGroupName) {
        log.info("targetGroupName: " + targetGroupName);
        Group group = groupRepository.findGroupByGuildSnowflakeAndName(guildSnowflake, targetGroupName)
                .orElseThrow(() -> ErrorStatus.GROUP_NAME_NOT_EXISTS.asControllerException());

        GroupDto groupDto = messageMacroService.getButtons(group);
        return ResponseEntity.ok(groupDto);
    }


    @GetMapping("/contents/{buttonId}")
    public ResponseEntity<ButtonDto> getButonContent(
            @PathVariable @NonNull String buttonId) {

        GroupItem groupItemById = groupItemRepository.findGroupItemById(UUID.fromString(buttonId))
                        .orElseThrow(()-> ErrorStatus.BUTTON_ID_NOT_EXISTS.asControllerException());

        ButtonDto contents = messageMacroService.getContents(groupItemById);
        return ResponseEntity.ok(contents);
    }
}