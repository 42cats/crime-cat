package com.crimecat.backend.messagemacro.controller;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.messagemacro.dto.GroupDto;

import com.crimecat.backend.messagemacro.service.MessageMacroService;
import jakarta.websocket.server.PathParam;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/message-macros/{guildSnowflake}")
@RequiredArgsConstructor
@Validated
public class MessageMacroController {
    private final MessageMacroService service;
    private final GuildRepository guildRepository;

    @GetMapping
    public ResponseEntity<List<GroupDto>> getMacros(@PathVariable @NonNull String guildSnowflake, Principal principal) {
        String userSnowflake = principal.getName();
        if(!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, userSnowflake)) {
            throw ErrorStatus.GUILD_ALREADY_EXISTS.asControllerException();
        }
        return ResponseEntity.ok(service.findByGuild(guildSnowflake));
    }

    @PostMapping
    public ResponseEntity<Void> syncMacros(
            @PathVariable @NonNull String guildSnowflake,
            @RequestBody @Valid List<GroupDto> groupDtos,
            Principal principal) {
        String userSnowflake = principal.getName();
        if(!guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, userSnowflake)) {
            throw ErrorStatus.GUILD_ALREADY_EXISTS.asControllerException();
        }
        service.syncMacroData(guildSnowflake, groupDtos);
        return ResponseEntity.noContent().build();
    }
}