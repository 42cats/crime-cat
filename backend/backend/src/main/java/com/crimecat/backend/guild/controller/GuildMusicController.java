package com.crimecat.backend.guild.controller;

import com.crimecat.backend.guild.dto.GuildMusicDeletedResponseDto;
import com.crimecat.backend.guild.dto.GuildMusicDto;
import com.crimecat.backend.guild.dto.GuildMusicListResponseDto;
import com.crimecat.backend.guild.dto.MessageDto;
import com.crimecat.backend.guild.service.GuildMusicService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/bot/guilds/{guildSnowflake}/music")
@RequiredArgsConstructor
public class GuildMusicController {
    private final GuildMusicService guildMusicService;

    @GetMapping
    public MessageDto<?> getMusics(@PathVariable String guildSnowflake) {
        try {
            GuildMusicListResponseDto guildMusicListResponseDto = guildMusicService.getMusics(guildSnowflake);
            return new MessageDto<>("guild music list founded!", guildMusicListResponseDto);
        } catch (Exception e) {
            return new MessageDto<>("guild not found");
        }
    }

    @DeleteMapping
    public MessageDto<?> deleteMusic(@PathVariable String guildSnowflake,
                                     @RequestHeader Map<String, String> headers) {
        try {
            if (!headers.containsKey("title")) {
                return new MessageDto<>("Wrong request");
            }
            String title = headers.get("title");
            guildMusicService.deleteMusic(guildSnowflake, title);
            return new MessageDto<>("Music deleted successfully",
                    new GuildMusicDeletedResponseDto(guildSnowflake, title));
        } catch (Exception e) {
            return new MessageDto<>("error occurs");
        }
    }

    @PostMapping
    public MessageDto<?> postMusic(@PathVariable String guildSnowflake,
                                   @RequestBody GuildMusicDto guildMusicDto) {
        try {
            guildMusicService.insertMusic(guildSnowflake, guildMusicDto);
            return new MessageDto<>("Music added successfully", guildMusicDto);
        } catch (ValidationException e) {
            return new MessageDto<>("body require element need");
        } catch (Exception e) {
            return new MessageDto<>("error occurred");
        }
    }
}
