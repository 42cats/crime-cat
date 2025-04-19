package com.crimecat.backend.auth.guild.controller;

import com.crimecat.backend.auth.guild.service.WebGuildService;
import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.crimecat.backend.webUser.domain.WebUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@Slf4j
@RestController
@RequestMapping("/api/v1/auth/guilds")
@RequiredArgsConstructor
public class WebGuildController {

    private final WebGuildService webGuildService;

    @GetMapping("")
    public ResponseEntity<?>getGuildList() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        DiscordOAuth2User principal = (DiscordOAuth2User) authentication.getPrincipal();
        WebUser webUser = principal.getWebUser();
        return ResponseEntity.ok(webGuildService.guildBotInfoDTOS(webUser));
    }
}
