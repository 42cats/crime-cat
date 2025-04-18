package com.crimecat.backend.auth.controller;

import com.crimecat.backend.auth.oauthUser.DiscordOAuth2User;
import com.crimecat.backend.auth.util.DiscordUserApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth/guild")
@RequiredArgsConstructor
public class WebGuildController {

    private final DiscordUserApiClient discordUserApiClient;

    @RequestMapping("/")
    public ResponseEntity<?>getGuildList() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof DiscordOAuth2User) {
            DiscordOAuth2User user = (DiscordOAuth2User) authentication.getPrincipal();
            String accessToken = user.getAccessToken();
            List<Map<String, Object>> userGuilds = discordUserApiClient.getUserGuilds(accessToken);
            log.info("users guild info {}", userGuilds.toString());
        }
        return null;
    }
}
