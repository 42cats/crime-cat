package com.crimecat.backend.guild.controller.web;

import com.crimecat.backend.api.discord.CachedDiscordBotService;
import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.dto.bot.RoleDto;
import com.crimecat.backend.guild.service.web.WebGuildService;
import com.crimecat.backend.utils.AuthenticationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * 웹 클라이언트용 Discord API 프록시 컨트롤러
 * Discord API를 안전하게 프록시하여 웹 클라이언트에서 사용할 수 있도록 함
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/discord/guilds")
public class DiscordProxyController {
    
    private final CachedDiscordBotService cachedDiscordBotService;
    private final WebGuildService webGuildService;
    
    /**
     * 길드의 역할 목록 조회 (웹용)
     * 길드 소유자만 조회 가능
     * 
     * @param guildId Discord 길드 ID
     * @return 역할 목록
     */
    @GetMapping("/{guildId}/roles")
    public ResponseEntity<List<RoleDto>> getGuildRoles(@PathVariable String guildId) {
        
        // 현재 인증된 사용자 정보 가져오기
        UUID currentUserId = AuthenticationUtil.getCurrentWebUserId();
        log.info("Web API - 길드 역할 목록 조회 요청: {} (사용자: {})", guildId, currentUserId);
        
        // 길드 소유자 권한 확인
        if (!webGuildService.isGuildOwner(guildId, currentUserId)) {
            log.warn("Web API - 권한 없음: 길드 {} (사용자: {})", guildId, currentUserId);
            throw ErrorStatus.NOT_GUILD_OWNER.asDomainException();
        }
        
        try {
            // 캐시된 역할 목록 조회
            List<RoleDto> roles = cachedDiscordBotService.getGuildRoles(guildId);
            
            log.info("Web API - 길드 역할 목록 조회 성공: {} ({}개 역할)", guildId, roles.size());
            return ResponseEntity.ok(roles);
            
        } catch (Exception e) {
            log.error("Web API - 길드 역할 목록 조회 실패: {}", guildId, e);
            throw ErrorStatus.DISCORD_GUILD_ROLES_FETCH_FAILED.asDomainException();
        }
    }
}