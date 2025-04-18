package com.crimecat.backend.auth.guild.service;

import com.crimecat.backend.auth.guild.api.DiscordUserApiClient;
import com.crimecat.backend.auth.guild.dto.GuildBotInfoDto;
import com.crimecat.backend.auth.guild.dto.GuildInfoDTO;
import com.crimecat.backend.auth.guild.dto.GuildResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebGuildService {

    private final DiscordUserApiClient discordUserApiClient;

    @Value("${spring.security.bot-auth.discord-bot-secret-tokens}")
    private List<String> botTokens;

    public GuildResponseDto guildInfoDTOS(List<Map<String, Object>> allGuilds) {
        List<GuildInfoDTO> simplifiedGuilds = allGuilds.stream()
                .filter(guild -> Boolean.TRUE.equals(guild.get("owner")))
                .map(guild -> {
                    String id = (String) guild.get("id");
                    String name = (String) guild.get("name");
                    String iconHash = (String) guild.get("icon");
                    boolean owner = true;
                    Number permissions = (Number) guild.get("permissions");

                    String iconUrl = (iconHash != null)
                            ? "https://cdn.discordapp.com/icons/" + id + "/" + iconHash + ".png"
                            : null;

                    List<String> features = (List<String>) guild.get("features");

                    GuildBotInfoDto botInfo = botTokens.stream()
                            .map(token -> {
                                try {
                                    return discordUserApiClient.getGuildInfoFromBot(id, token);
                                } catch (Exception e) {
                                    log.debug("❌ 봇 '{}'이 '{}' 길드 접근 실패: {}", token.substring(0, 10), id, e.getMessage());
                                    return null;
                                }
                            })
                            .filter(dto -> dto != null)
                            .findFirst()
                            .orElse(null);

                    return new GuildInfoDTO(
                            id,
                            name,
                            iconUrl,
                            owner,
                            botInfo != null ? botInfo.getApproximate_member_count() : null,
                            botInfo != null ? botInfo.getApproximate_presence_count() : null,
                            permissions != null ? permissions.longValue() : 0L,
                            features != null ? features : List.of()
                    );
                })
                .collect(Collectors.toList());

        return new GuildResponseDto(simplifiedGuilds);
    }
}
