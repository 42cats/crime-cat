package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.*;
import com.crimecat.backend.guild.service.GuildMusicService;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/music")
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
