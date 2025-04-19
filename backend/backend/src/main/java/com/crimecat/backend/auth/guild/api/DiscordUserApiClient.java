package com.crimecat.backend.auth.guild.api;

import com.crimecat.backend.auth.guild.dto.GuildBotInfoDto;
import com.crimecat.backend.auth.guild.dto.GuildInfoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DiscordUserApiClient {

    @Value("${spring.security.bot-auth.discord-bot-secret-token}")
    private List<String> botTokens;

    private final WebClient discordWebClient = WebClient.builder()
            .baseUrl("https://discord.com/api/v10")
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

    public GuildBotInfoDto getGuildBotInfoDto(int botTokenIndex, String guildSnowflake) {
        return discordWebClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/guilds/{guildId}")
                        .queryParam("with_counts", "true")
                        .build(guildSnowflake))
                .header("Authorization", "Bot " + botTokens.get(botTokenIndex))
                .retrieve()
                .bodyToMono(GuildBotInfoDto.class)
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

    public GuildBotInfoDto getGuildInfoFromBot(String guildId, String botToken) {
        return discordWebClient.get()
                .uri("/guilds/{guildId}?with_counts=true", guildId)
                .header("Authorization", "Bot " + botToken)
                .retrieve()
                .bodyToMono(GuildBotInfoDto.class)
                .doOnSuccess(res -> log.info("✅ [길드 정보 조회 성공] guildId={}, 인원수={}", guildId, res.getApproximate_member_count()))
                .doOnError(err -> log.error("❌ [길드 정보 조회 실패] guildId={}, 에러={}", guildId, err.getMessage()))
                .block();
    }
}
