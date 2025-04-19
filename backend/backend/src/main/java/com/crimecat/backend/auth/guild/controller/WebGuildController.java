package com.crimecat.backend.auth.guild.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.service.DiscordRedisTokenService;
import com.crimecat.backend.guild.repository.GuildRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth/guilds")
@RequiredArgsConstructor
public class WebGuildController {

//    private final DiscordUserApiClient discordUserApiClient;
    private final DiscordRedisTokenService discordRedisTokenService;
//    private final WebGuildService webGuildService;
    private final GuildRepository guildRepository;

    @GetMapping("")
    public ResponseEntity<?>getGuildList() {
        log.info("겟 요청 성공");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        DiscordOAuth2User principal = (DiscordOAuth2User) authentication.getPrincipal();
        Object name = principal.getName();
        log.info("user id {} name {}", userId, name);
        return ResponseEntity.ok(null);
//        guildRepository.findActiveGuildsByOwner()
//        log.info("users guild info {}", );
//        return ResponseEntity.ok(webGuildService.guildInfoDTOS(userGuilds));
    }
}
