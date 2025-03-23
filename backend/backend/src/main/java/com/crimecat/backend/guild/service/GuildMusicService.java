package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.domain.Music;
import com.crimecat.backend.guild.dto.GuildMusicDto;
import com.crimecat.backend.guild.dto.GuildMusicListResponseDto;
import com.crimecat.backend.guild.repository.GuildMusicRepository;
import com.crimecat.backend.guild.repository.GuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuildMusicService {
    private final GuildRepository guildRepository;
    private final GuildMusicRepository guildMusicRepository;
    public GuildMusicListResponseDto getMusics(String guildSnowflake) {
        guildRepository.findBySnowflake(guildSnowflake).orElseThrow(RuntimeException::new);
        return new GuildMusicListResponseDto(guildSnowflake,
                guildMusicRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .map(v -> new GuildMusicDto(v.getTitle(), v.getYoutubeUrl(),
                                v.getThumbnail(), v.getDuration(), v.getCreatedAt()))
                        .toList()
        );
    }

    public void deleteMusic(String guildSnowflake, String title) {
        if (guildMusicRepository.deleteByGuildSnowflakeAndTitle(guildSnowflake, title) == 0) {
            throw new RuntimeException();
        }
    }

    public void insertMusic(String guildSnowflake, GuildMusicDto guildMusicDto) {
        Music music = new Music(guildSnowflake, guildMusicDto);
        guildMusicRepository.save(music);
    }
}
