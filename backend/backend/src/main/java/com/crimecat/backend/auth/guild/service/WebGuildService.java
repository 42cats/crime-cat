package com.crimecat.backend.auth.guild.service;

import com.crimecat.backend.auth.guild.api.DiscordUserApiClient;
import com.crimecat.backend.auth.guild.dto.GuildBotInfoDto;
import com.crimecat.backend.auth.guild.dto.GuildInfoDTO;
import com.crimecat.backend.auth.guild.dto.GuildResponseDto;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebGuildService {

    private final DiscordUserApiClient discordUserApiClient;
    private final GuildRepository guildRepository;

    public GuildResponseDto guildBotInfoDTOS(WebUser webUser) {
        String discordUserSnowflake = webUser.getDiscordUserSnowflake();
        List<Guild> guildList = guildRepository.findActiveGuildsByOwner(discordUserSnowflake);
        log.info("guild list {}", guildList.toString());
        ExecutorService executor = Executors.newFixedThreadPool(3);
        ConcurrentMap<String, GuildBotInfoDto> resultMap = new ConcurrentHashMap<>();

        List<CompletableFuture<Void>> futures = IntStream.range(0, 4)
                .mapToObj(botIndex -> CompletableFuture.runAsync(() -> {
                    for (Guild guild : guildList) {
                        String guildId = guild.getSnowflake();

                        // 이미 성공적으로 처리된 길드는 스킵
                        if (resultMap.containsKey(guildId)) continue;

                        try {
                            GuildBotInfoDto info = discordUserApiClient.getGuildBotInfoDto(botIndex, guildId);
                            if (info != null) {
                                // 동시에 여러 스레드가 성공할 수 있으므로 putIfAbsent
                                resultMap.putIfAbsent(guildId, info);
                                log.info("✅ [길드 정보 획득 성공] guildId={}, by botTokenIndex={}", guildId, botIndex);
                            }
                        } catch (Exception e) {
                            log.warn("❌ [길드 정보 가져오기 실패] guildId={}, botTokenIndex={}, 원인={}", guildId, botIndex, e.toString());
                        }
                    }
                }, executor))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();


        return new GuildResponseDto(resultMap.values().stream().toList());
    }
}
