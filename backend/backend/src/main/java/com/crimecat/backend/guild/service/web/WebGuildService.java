package com.crimecat.backend.guild.service.web;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.api.discord.DiscordBotApi;
import com.crimecat.backend.guild.dto.web.ApiGetGuildInfoDto;
import com.crimecat.backend.guild.dto.web.ChannelDto;
import com.crimecat.backend.guild.dto.web.GuildBotInfoDto;
import com.crimecat.backend.guild.dto.web.GuildResponseDto;
import com.crimecat.backend.webUser.domain.WebUser;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebGuildService {

    private final GuildRepository guildRepository;
    private final DiscordBotApi discordBotApi;

    public GuildResponseDto guildBotInfoDTOS(WebUser webUser) {
        String discordUserSnowflake = webUser.getDiscordUserSnowflake();
        List<Guild> guildList = guildRepository.findActiveGuildsByOwner(discordUserSnowflake);
        log.info("🎯 사용자 {}의 길드 목록: {}", discordUserSnowflake, guildList);

        Map<String, GuildBotInfoDto> resultMap = new HashMap<>();

        for (Guild guild : guildList) {
            String guildId = guild.getSnowflake();

            try {
                // ✅ 봇 토큰 인덱스 없이 단일 API 클라이언트 사용
                ApiGetGuildInfoDto apiGuildInfo = discordBotApi.getGuildInfo(guildId).block(); // WebClient Mono → block()

                log.info("🌐 [응답] guildId={} → {}", guildId, apiGuildInfo);

                GuildBotInfoDto converted = convertToGuildBotInfo(apiGuildInfo, discordUserSnowflake);
                if (converted != null) {
                    resultMap.putIfAbsent(guildId, converted);
                    log.info("✅ [길드 변환 성공] guildId={}", guildId);
                } else {
                    log.info("🚫 [오너 불일치] guildId={}", guildId);
                }
            } catch (Exception e) {
                log.warn("❌ [길드 정보 실패] guildId={}, error={}", guildId, e.toString());
            }
        }

        return new GuildResponseDto(new ArrayList<>(resultMap.values()));
    }



    public List<ChannelDto> getGuildChannels(String guildSnowflake) {
        try {
            List<ChannelDto> result = discordBotApi.getGuildChannels(guildSnowflake); // botIndex 제거
            if (result != null && !result.isEmpty()) {
                log.info("✅ [채널 정보 획득 성공] guildId={}", guildSnowflake);
                return result;
            } else {
                log.warn("⚠️ [빈 채널 리스트] guildId={}", guildSnowflake);
                return List.of(); // 빈 리스트 반환
            }
        } catch (Exception e) {
            log.error("❌ [채널 정보 조회 실패] guildId={}, error={}", guildSnowflake, e.toString());
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
