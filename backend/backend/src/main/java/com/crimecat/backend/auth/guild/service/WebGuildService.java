package com.crimecat.backend.auth.guild.service;

import com.crimecat.backend.auth.guild.api.DiscordUserApiClient;
import com.crimecat.backend.auth.guild.dto.ApiGetGuildInfoDto;
import com.crimecat.backend.auth.guild.dto.ChannelDto;
import com.crimecat.backend.auth.guild.dto.GuildBotInfoDto;
import com.crimecat.backend.auth.guild.dto.GuildResponseDto;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
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
        log.info("🎯 사용자 {}의 길드 목록: {}", discordUserSnowflake, guildList);

        ExecutorService executor = Executors.newFixedThreadPool(3);
        ConcurrentMap<String, GuildBotInfoDto> resultMap = new ConcurrentHashMap<>();

        List<CompletableFuture<Void>> futures = IntStream.range(0, 4)
                .mapToObj(botIndex -> CompletableFuture.runAsync(() -> {
                    for (Guild guild : guildList) {
                        String guildId = guild.getSnowflake();
                        if (resultMap.containsKey(guildId)) continue;

                        try {
                            ApiGetGuildInfoDto apiGuildInfo = discordUserApiClient.getApiGetGuildInfoDto(botIndex, guildId);
                            log.info("🌐 [응답] botIndex={} → {}", botIndex, apiGuildInfo);

                            GuildBotInfoDto converted = convertToGuildBotInfo(apiGuildInfo, discordUserSnowflake);
                            if (converted != null) {
                                resultMap.putIfAbsent(guildId, converted);
                                log.info("✅ [길드 변환 성공] guildId={}, botIndex={}", guildId, botIndex);
                            } else {
                                log.info("🚫 [오너 불일치] guildId={}, botIndex={}", guildId, botIndex);
                            }
                        } catch (Exception e) {
                            log.warn("❌ [길드 정보 실패] guildId={}, botIndex={}, error={}", guildId, botIndex, e.toString());
                        }
                    }
                }, executor))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();

        return new GuildResponseDto(resultMap.values().stream().toList());
    }


    public List<ChannelDto> getGuildChannels(String guildSnowflake) {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        CompletableFuture<List<ChannelDto>> resultFuture = new CompletableFuture<>();

        for (int i = 0; i < 4; i++) {
            final int botIndex = i;
            executor.submit(() -> {
                try {
                    List<ChannelDto> result = discordUserApiClient.getGuildChannels(botIndex, guildSnowflake);
                    if (result != null && !result.isEmpty()) {
                        log.info("✅ [채널 정보 획득 성공] botIndex={}, guildId={}", botIndex, guildSnowflake);
                        resultFuture.complete(result);
                    } else {
                        log.warn("⚠️ [빈 채널 리스트] botIndex={}, guildId={}", botIndex, guildSnowflake);
                    }
                } catch (Exception e) {
                    log.warn("❌ [채널 정보 실패] botIndex={}, guildId={}, error={}", botIndex, guildSnowflake, e.toString());
                }
            });
        }

        try {
            List<ChannelDto> channels = resultFuture.get(5, TimeUnit.SECONDS);
            executor.shutdownNow();
            return channels;
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            log.error("⛔ [모든 봇 실패 또는 시간 초과] guildId={}, error={}", guildSnowflake, e.toString());
            executor.shutdownNow();
            return List.of(); // 실패 시 빈 리스트 반환
        }
    }

    private GuildBotInfoDto convertToGuildBotInfo(ApiGetGuildInfoDto info, String currentUserId) {
        if (!info.getOwnerId().equals(currentUserId)) {
            return null; // 오너가 아닐 경우 제외
        }

        GuildBotInfoDto dto = new GuildBotInfoDto();
        dto.setId(info.getId());
        dto.setName(info.getName());
        dto.setIcon(info.getIcon());
        dto.setOwner(true); // 본인이 오너이므로 true
        dto.setApproximate_member_count(info.getApproximateMemberCount());
        dto.setApproximate_presence_count(info.getApproximatePresenceCount());

        // roles 중 본인의 역할을 찾아 permission 설정 (아니면 default 0)
        if (info.getRoles() != null) {
            dto.setPermissions(
                    info.getRoles().stream()
                            .filter(role -> role.getTags() != null && currentUserId.equals(role.getTags().getBotId()))
                            .mapToLong(role -> {
                                try {
                                    return Long.parseLong(role.getPermissions());
                                } catch (NumberFormatException e) {
                                    return 0L;
                                }
                            })
                            .findFirst()
                            .orElse(0L)
            );
        }

        return dto;
    }


}
