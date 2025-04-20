package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.GroupDto;

import com.crimecat.backend.messagemacro.service.MessageMacroService;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/messageMacros")
@RequiredArgsConstructor
@Validated
public class MessageMacroController {
    private final MessageMacroService messageMacroService;
    private final GuildRepository guildRepository;

    @GetMapping("/{guildSnowflake}")
    public ResponseEntity<List<GroupDto>> getMacros(@PathVariable @NonNull String guildSnowflake) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
        WebUser webUser = user.getWebUser();
        log.info("여기도착");
        if(!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake())) {
            throw ErrorStatus.GUILD_ALREADY_EXISTS.asControllerException();
        }
        return ResponseEntity.ok(messageMacroService.getGroups(guildSnowflake));
    }

    @PostMapping("/{guildSnowflake}")
    public ResponseEntity<Void> syncMacros(
            @PathVariable @NonNull String guildSnowflake,
            @RequestBody @Valid List<GroupDto> groupDtos) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
        WebUser webUser = user.getWebUser();
        if(!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake())) {
            throw ErrorStatus.GUILD_ALREADY_EXISTS.asControllerException();
        }
        messageMacroService.syncMacroData(guildSnowflake, groupDtos);
        return ResponseEntity.noContent().build();
    }
}