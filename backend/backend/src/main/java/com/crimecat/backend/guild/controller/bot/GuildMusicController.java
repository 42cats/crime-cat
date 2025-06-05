package com.crimecat.backend.guild.controller.bot;

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

import com.crimecat.backend.guild.dto.bot.GuildMusicDeletedResponseDto;
import com.crimecat.backend.guild.dto.bot.GuildMusicListResponseDto;
import com.crimecat.backend.guild.dto.bot.GuildMusicRequestDto;
import com.crimecat.backend.guild.dto.bot.MessageDto;
import com.crimecat.backend.guild.service.bot.GuildMusicService;

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
            return new MessageDto<>("길드의 음악리스트를 찾았 습니다.", guildMusicListResponseDto);
        } catch (Exception e) {
            return new MessageDto<>("길드를 찾을수 없습니다. 봇에 길드가 등록되지 않았습니다. 봇을 내보내고 다시 불러봐 주세요.");
        }
    }

    @DeleteMapping
    public MessageDto<GuildMusicDeletedResponseDto> deleteMusic(@PathVariable String guildSnowflake,
                                     @RequestHeader Map<String, String> headers) {
        if (!headers.containsKey("title")) {
            return new MessageDto<>("잘못된 요청 입니다.");
        }
        String title = URLDecoder.decode(headers.get("title"), StandardCharsets.UTF_8);
        guildMusicService.deleteMusic(guildSnowflake, title);
        return new MessageDto<>("음악이 성공적으로 삭제 되었습니다.",
                new GuildMusicDeletedResponseDto(guildSnowflake, title));
    }

    @PostMapping
    public MessageDto<GuildMusicRequestDto> postMusic(@PathVariable String guildSnowflake,
                                               @RequestBody GuildMusicRequestDto guildMusicDto) {
        guildMusicService.addMusic(guildSnowflake, guildMusicDto);
        return new MessageDto<>("음악이 성공적으로 추가되었습니다.", guildMusicDto);
    }
}
