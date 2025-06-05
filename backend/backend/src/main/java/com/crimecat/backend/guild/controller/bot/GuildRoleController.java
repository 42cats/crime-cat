package com.crimecat.backend.guild.controller.bot;

import com.crimecat.backend.api.discord.CachedDiscordBotService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.guild.dto.bot.RoleDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Discord Bot용 역할 관리 컨트롤러
 * Bot이 길드의 역할 목록을 조회할 때 사용
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/roles")
public class GuildRoleController {
    
    private final CachedDiscordBotService cachedDiscordBotService;
    
    /**
     * 길드의 모든 역할 목록 조회
     * 캐시된 데이터를 반환하여 Discord API 호출 최소화
     * 
     * @param guildSnowflake Discord 길드 ID
     * @return 역할 목록
     */
    @GetMapping
    public MessageDto<List<RoleDto>> getGuildRoles(@PathVariable String guildSnowflake) {
        log.info("Bot API - 길드 역할 목록 조회 요청: {}", guildSnowflake);
        
        try {
            List<RoleDto> roles = cachedDiscordBotService.getGuildRoles(guildSnowflake);
            
            log.info("Bot API - 길드 역할 목록 조회 성공: {} ({}개 역할)", guildSnowflake, roles.size());
      return new MessageDto<>("길드 역할이 성공적으로 조회되었습니다", roles);

        } catch (Exception e) {
            log.error("Bot API - 길드 역할 목록 조회 실패: {}", guildSnowflake, e);
            throw ErrorStatus.DISCORD_GUILD_ROLES_FETCH_FAILED.asDomainException();
        }
    }
}