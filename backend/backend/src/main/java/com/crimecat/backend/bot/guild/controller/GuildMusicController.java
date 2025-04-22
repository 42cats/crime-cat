package com.crimecat.backend.bot.guild.controller;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crimecat.backend.bot.guild.dto.GuildMusicDeletedResponseDto;
import com.crimecat.backend.bot.guild.dto.GuildMusicListResponseDto;
import com.crimecat.backend.bot.guild.dto.GuildMusicRequestDto;
import com.crimecat.backend.bot.guild.dto.MessageDto;
import com.crimecat.backend.bot.guild.service.GuildMusicService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bot/v1/guilds/{guildSnowflake}/music")
@RequiredArgsConstructor
public class GuildMusicController {
    private final GuildMusicService guildMusicService;

    @GetMapping
    public MessageDto<GuildMusicListResponseDto> getMusics(@PathVariable String guildSnowflake) {
        try {
            GuildMusicListResponseDto guildMusicListResponseDto = guildMusicService.getMusics(guildSnowflake);
            return new MessageDto<>("guild music list founded!", guildMusicListResponseDto);
        } catch (Exception e) {
            return new MessageDto<>("guild not found");
        }
    }

    @DeleteMapping
    public MessageDto<GuildMusicDeletedResponseDto> deleteMusic(@PathVariable String guildSnowflake,
                                     @RequestHeader Map<String, String> headers) {
        if (!headers.containsKey("title")) {
            return new MessageDto<>("Wrong request");
        }
        String title = URLDecoder.decode(headers.get("title"), StandardCharsets.UTF_8);
        guildMusicService.deleteMusic(guildSnowflake, title);
        return new MessageDto<>("Music deleted successfully",
                new GuildMusicDeletedResponseDto(guildSnowflake, title));
    }

    @PostMapping
    public MessageDto<GuildMusicRequestDto> postMusic(@PathVariable String guildSnowflake,
                                               @RequestBody GuildMusicRequestDto guildMusicDto) {
        guildMusicService.addMusic(guildSnowflake, guildMusicDto);
        return new MessageDto<>("Music added successfully", guildMusicDto);
    }
}
