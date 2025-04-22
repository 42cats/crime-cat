package com.crimecat.backend.web.messagemacro.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import com.crimecat.backend.web.messagemacro.dto.GroupDto;
import com.crimecat.backend.web.messagemacro.service.MessageMacroService;
import com.crimecat.backend.web.webUser.domain.WebUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
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
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
        }
        messageMacroService.syncMacroData(guildSnowflake, groupDtos);
        return ResponseEntity.noContent().build();
    }
}