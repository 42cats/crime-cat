package com.crimecat.backend.api.discord;

import com.crimecat.backend.api.AbstractApiService;
import com.crimecat.backend.guild.dto.web.ApiGetGuildInfoDto;
import com.crimecat.backend.guild.dto.web.ChannelDto;
import com.crimecat.backend.guild.dto.web.DiscordChannelResponse;
import com.crimecat.backend.guild.dto.bot.RoleDto;
import com.crimecat.backend.guild.domain.ChannelType;
import com.crimecat.backend.trace.annotation.NoTrace;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@NoTrace
public class DiscordBotApi extends AbstractApiService {

  private static final String BASE_URL = "https://discord.com/api/v10";
  public DiscordBotApi(
      @Value("${spring.security.bot-auth.discord-bot-secret-token}") String secretKey
  ) {
    super(BASE_URL,
        WebClient.builder()
            .defaultHeader("Authorization", "Bot " + secretKey)
    );
  }

  public Mono<ApiGetGuildInfoDto> getGuildInfo(String guildSnowflake) {
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/guilds/{guildId}")
            .queryParam("with_counts", "true")
            .build(Map.of("guildId", guildSnowflake)))
        .retrieve()
        .bodyToMono(ApiGetGuildInfoDto.class);
  }

  /**
   * 길드의 채널 목록을 조회합니다
   * Discord API에서 채널 정보를 가져와 타입 정보를 포함하여 변환합니다
   * 
   * @param guildSnowflake 길드 ID
   * @return 채널 정보 목록 (타입 정보 포함)
   */
  public List<ChannelDto> getGuildChannels(String guildSnowflake){
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/guilds/{guildId}/channels")
            .build(guildSnowflake))
        .retrieve()
        .bodyToFlux(DiscordChannelResponse.class)
        .map(this::convertToChannelDto)
        .collectList()
        .block();
  }
  
  /**
   * Discord API 응답을 ChannelDto로 변환합니다
   * 채널 타입 정보를 포함하여 프론트엔드용 형태로 변환합니다
   * 
   * @param response Discord API 응답
   * @return 변환된 ChannelDto
   */
  private ChannelDto convertToChannelDto(DiscordChannelResponse response) {
    ChannelType channelType = ChannelType.fromTypeId(response.getType() != null ? response.getType() : -1);
    
    ChannelDto dto = new ChannelDto();
    dto.setId(response.getId());
    dto.setName(response.getName());
    dto.setType(response.getType());
    dto.setTypeKey(channelType.getTypeKey());
    dto.setDisplayName(channelType.getDisplayName());
    dto.setEmoji(channelType.getEmoji());
    dto.setPosition(response.getPosition());
    dto.setParentId(response.getParentId());
    dto.setTopic(response.getTopic());
    dto.setNsfw(response.getNsfw());
    
    return dto;
  }

  public List<RoleDto> getGuildRoles(String guildSnowflake) {
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/guilds/{guildId}/roles")
            .build(guildSnowflake))
        .retrieve()
        .bodyToFlux(RoleDto.class)
        .collectList()
        .block();
  }
}
