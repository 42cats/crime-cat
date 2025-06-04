package com.crimecat.backend.api.discord;

import com.crimecat.backend.api.AbstractApiService;
import com.crimecat.backend.guild.dto.web.ApiGetGuildInfoDto;
import com.crimecat.backend.guild.dto.web.ChannelDto;
import com.crimecat.backend.guild.dto.bot.RoleDto;
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

  public List<ChannelDto> getGuildChannels(String guildSnowflake){
    return webClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/guilds/{guildId}/channels")
            .build(guildSnowflake))
        .retrieve()
        .bodyToFlux(ChannelDto.class)
        .collectList()
        .block();
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
