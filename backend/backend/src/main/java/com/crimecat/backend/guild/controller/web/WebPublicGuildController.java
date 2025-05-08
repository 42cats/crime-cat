package com.crimecat.backend.guild.controller.web;

import com.crimecat.backend.guild.dto.web.GuildInfoResponseDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.guild.service.web.WebGuildService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/public/guilds")
@RequiredArgsConstructor
public class WebPublicGuildController {

    private final WebGuildService webGuildService;
    private final GuildRepository guildRepository;

    @GetMapping("{guild_snowflake}/info")
    public ResponseEntity<GuildInfoResponseDto> getGuildInfo(@PathVariable("guild_snowflake") String guildId){
        GuildInfoResponseDto guildPublicInfo = webGuildService.getGuildPublicInfo(guildId);
        return ResponseEntity.ok().body(guildPublicInfo);
    }

}
