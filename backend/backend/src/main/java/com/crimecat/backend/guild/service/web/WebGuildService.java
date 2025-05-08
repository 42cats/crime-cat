package com.crimecat.backend.guild.service.web;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gameHistory.domain.GameHistory;
import com.crimecat.backend.gameHistory.repository.GameHistoryRepository;
import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.web.GuildInfoResponseDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.api.discord.DiscordBotApi;
import com.crimecat.backend.guild.dto.web.ApiGetGuildInfoDto;
import com.crimecat.backend.guild.dto.web.ChannelDto;
import com.crimecat.backend.guild.dto.web.GuildBotInfoDto;
import com.crimecat.backend.guild.dto.web.GuildResponseDto;
import com.crimecat.backend.webUser.domain.WebUser;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebGuildService {

    private final GuildRepository guildRepository;
    private final DiscordBotApi discordBotApi;
    private final GameHistoryRepository gameHistoryRepository;

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


  /**
   * 길드의 공개 정보를 조회합니다.
   * 
   * @param guildSnowFlake 조회할 길드의 UUID 문자열
   * @return 길드 정보가 포함된 GuildInfoResponseDto 객체
   * @throws com.crimecat.backend.exception.CrimeCatException 길드를 찾을 수 없거나, API 호출 실패, 또는 매개변수 형식이 잘못된 경우
   */
  public GuildInfoResponseDto getGuildPublicInfo(String guildSnowFlake) {
      // 1. guildId 유효성 검사
      // 2. Guild 조회
      Guild guild = guildRepository.findBySnowflake(guildSnowFlake)
          .orElseThrow(() -> {
              log.error("길드를 찾을 수 없음: {}", guildSnowFlake);
              return ErrorStatus.GUILD_NOT_FOUND.asServiceException();
          });

      UUID guildUuid = guild.getId();
      String guildId = guild.getId().toString();

      // 3. Discord API 호출 (예외 처리 추가)
      ApiGetGuildInfoDto apiGuildInfo;
      try {
          apiGuildInfo = discordBotApi.getGuildInfo(guild.getSnowflake())
              .timeout(Duration.ofSeconds(5))  // 5초 타임아웃 설정
              .block();
          
          if (apiGuildInfo == null) {
            throw ErrorStatus.INTERNAL_ERROR.asServiceException();
          }
      } catch (Exception e) {
          log.error("Discord API 호출 실패: guildId={}, error={}", guildId, e.getMessage(), e);
          throw ErrorStatus.INTERNAL_ERROR.asServiceException();
      }
      
      // 4. 게임 히스토리 조회 (예외 처리 추가)
      long totalCount = 0;
      LocalDateTime latestPlayTime = null;
      
      try {
          List<GameHistory> allById = gameHistoryRepository.findByGuild_Id(guildUuid);
          totalCount = allById.size();
          
          latestPlayTime = allById.stream()
              .map(GameHistory::getCreatedAt)
              .max(LocalDateTime::compareTo)
              .orElse(null);  // 기록이 없으면 null
      } catch (Exception e) {
          log.error("게임 히스토리 조회 실패: guildId={}, error={}", guildId, e.getMessage(), e);
          // 조회 실패 시 기본값 사용 (예외를 던지지 않고 진행)
      }
      
      // 5. DTO 변환 및 반환
      try {
          return GuildInfoResponseDto.from(guild, apiGuildInfo, totalCount, latestPlayTime);
      } catch (Exception e) {
          log.error("DTO 변환 실패: guildId={}, error={}", guildId, e.getMessage(), e);
          throw ErrorStatus.INTERNAL_ERROR.asServiceException();
      }
  }
}
