package com.crimecat.backend.guild.controller.web;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.service.web.WebGuildService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import com.crimecat.backend.api.discord.CachedDiscordBotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth/guilds")
@RequiredArgsConstructor
public class WebGuildController {

    private final WebGuildService webGuildService;
    private final GuildRepository guildRepository;
    private final CachedDiscordBotService cachedDiscordBotService;

    @GetMapping("")
    public ResponseEntity<?>getGuildList() {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        return ResponseEntity.ok(webGuildService.guildBotInfoDTOS(webUser));
    }

    @GetMapping("/channels/{guildSnowflake}")
    public ResponseEntity<?>getGuildList(@PathVariable String guildSnowflake) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException(); // 해당길드의 오너가 아님
        }
        return ResponseEntity.ok(webGuildService.getGuildChannels(guildSnowflake));
    }

    /**
     * 특정 길드의 역할 목록을 조회합니다
     * 
     * @param guildSnowflake 길드 ID
     * @return 역할 목록
     */
    @GetMapping("/roles/{guildSnowflake}")
    public ResponseEntity<?> getGuildRoles(@PathVariable String guildSnowflake) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        return ResponseEntity.ok(webGuildService.getGuildRoles(guildSnowflake));
    }

    @GetMapping("/settings/{guild_id}/public")
    public ResponseEntity<Boolean> getIsPublic(@PathVariable("guild_id") String guildSnowflake){
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        boolean isPublic = webGuildService.getGuildPublicStatus(guildSnowflake);
        return ResponseEntity.ok(isPublic);
    }

    @PatchMapping("/settings/{guild_id}/public")
    public ResponseEntity<Boolean> setIsPublic(@PathVariable("guild_id") String guildSnowflake){
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        boolean newStatus = webGuildService.toggleGuildPublicStatus(guildSnowflake);
        return ResponseEntity.ok(newStatus);
    }

    /**
     * 특정 길드의 채널 캐시를 무효화합니다
     * Discord에서 채널이 추가/수정/삭제될 때 호출됩니다
     * 
     * @param guildSnowflake 길드 ID
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/cache/channels/{guildSnowflake}")
    public ResponseEntity<String> evictChannelCache(@PathVariable String guildSnowflake) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        
        try {
            // 채널 캐시만 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            log.info("✅ [채널 캐시 무효화 성공] guildId={}, userId={}", guildSnowflake, webUser.getDiscordUserSnowflake());
            return ResponseEntity.ok("채널 캐시가 성공적으로 무효화되었습니다.");
        } catch (Exception e) {
            log.error("❌ [채널 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }

    /**
     * 특정 길드의 역할 캐시를 무효화합니다
     * Discord에서 역할이 추가/수정/삭제될 때 호출됩니다
     * 
     * @param guildSnowflake 길드 ID
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/cache/roles/{guildSnowflake}")
    public ResponseEntity<String> evictRoleCache(@PathVariable String guildSnowflake) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        
        try {
            // 역할 캐시만 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            log.info("✅ [역할 캐시 무효화 성공] guildId={}, userId={}", guildSnowflake, webUser.getDiscordUserSnowflake());
            return ResponseEntity.ok("역할 캐시가 성공적으로 무효화되었습니다.");
        } catch (Exception e) {
            log.error("❌ [역할 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }

    /**
     * 특정 길드의 모든 캐시를 무효화합니다
     * 길드 정보, 채널, 역할 캐시를 모두 무효화합니다
     * 
     * @param guildSnowflake 길드 ID
     * @return 캐시 무효화 결과
     */
    @DeleteMapping("/cache/all/{guildSnowflake}")
    public ResponseEntity<String> evictAllGuildCache(@PathVariable String guildSnowflake) {
        WebUser webUser = AuthenticationUtil.getCurrentWebUser();
        boolean isOwner = guildRepository.existsBySnowflakeAndOwnerSnowflake(guildSnowflake, webUser.getDiscordUserSnowflake());
        if (!isOwner) {
            throw ErrorStatus.NOT_GUILD_OWNER.asControllerException();
        }
        
        try {
            // 해당 길드의 모든 캐시 무효화
            cachedDiscordBotService.evictGuildCache(guildSnowflake);
            log.info("✅ [길드 전체 캐시 무효화 성공] guildId={}, userId={}", guildSnowflake, webUser.getDiscordUserSnowflake());
            return ResponseEntity.ok("길드의 모든 캐시가 성공적으로 무효화되었습니다.");
        } catch (Exception e) {
            log.error("❌ [길드 전체 캐시 무효화 실패] guildId={}, error={}", guildSnowflake, e.getMessage(), e);
            throw ErrorStatus.INTERNAL_ERROR.asControllerException();
        }
    }

}
