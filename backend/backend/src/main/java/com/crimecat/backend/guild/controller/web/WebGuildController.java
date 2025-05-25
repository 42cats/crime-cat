package com.crimecat.backend.guild.controller.web;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.service.web.WebGuildService;
import com.crimecat.backend.utils.AuthenticationUtil;
import com.crimecat.backend.webUser.domain.WebUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

}
