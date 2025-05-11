package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.GroupDto;
import com.crimecat.backend.messagemacro.service.MessageMacroService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
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
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        if(!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake())) {
            throw ErrorStatus.GUILD_NOT_FOUND.asControllerException();
        }
        messageMacroService.syncMacroData(guildSnowflake, groupDtos);
        return ResponseEntity.noContent().build();
    }
}