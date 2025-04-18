package com.crimecat.backend.auth.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DiscordUserApiClient {

    private final WebClient discordWebClient = WebClient.builder()
            .baseUrl("https://discord.com/api")
            .defaultHeader("Content-Type", "application/json")
            .build();

    public Map<String, Object> getUserInfo(String accessToken) {
        return discordWebClient.get()
                .uri("/users/@me")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public List<Map<String, Object>> getUserGuilds(String accessToken) {
        return discordWebClient.get()
                .uri("/users/@me/guilds")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(List.class)
                .block();
    }

    public void inviteUserToGuild(String botToken, String userId, String userAccessToken, String guildId) {
        discordWebClient.put()
                .uri("/guilds/{guildId}/members/{userId}", guildId, userId)
                .header("Authorization", "Bot " + botToken)
                .bodyValue(Map.of("access_token", userAccessToken))
                .retrieve()
                .toBodilessEntity()
                .doOnSuccess(res -> log.info("✅ [디스코드 초대 성공] 유저ID={} → 길드ID={}", userId, guildId))
                .doOnError(err -> log.error("❌ [디스코드 초대 실패] 유저ID={}, 원인={}", userId, err.getMessage()))
                .block();
    }
}
