package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Music;
import com.crimecat.backend.guild.dto.GuildMusicDto;
import com.crimecat.backend.guild.dto.GuildMusicListResponseDto;
import com.crimecat.backend.guild.dto.GuildMusicRequestDto;
import com.crimecat.backend.guild.repository.GuildMusicRepository;
import com.crimecat.backend.guild.repository.GuildRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.ExampleMatcher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class GuildMusicService {
    private final GuildQueryService guildQueryService;
    private final GuildMusicRepository guildMusicRepository;
    public GuildMusicListResponseDto getMusics(String guildSnowflake) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        return new GuildMusicListResponseDto(guildSnowflake,
                guildMusicRepository.findByGuildSnowflake(guildSnowflake).stream()
                        .map(v -> new GuildMusicDto(v.getTitle(), v.getYoutubeUrl(),
                                v.getThumbnail(), v.getDuration(), v.getCreatedAt()))
                        .sorted(Comparator.comparing(GuildMusicDto::getCreatedAt))
                        .toList()
        );
    }

    @Transactional
    public void deleteMusic(String guildSnowflake, String title) {
        if (guildMusicRepository.deleteByGuildSnowflakeAndTitle(guildSnowflake, title) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "no music found");
        }
    }

    public void addMusic(String guildSnowflake, GuildMusicRequestDto guildMusicRequestDto) {
        if (!guildQueryService.existsBySnowflake(guildSnowflake)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "guild not exists");
        }
        if (guildMusicRepository.existsByGuildSnowflakeAndTitle(guildSnowflake, guildMusicRequestDto.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "music already exists");
        }
        Music music = new Music(guildSnowflake, guildMusicRequestDto);
        // TODO: ConstraintViolationException 처리 (validation 처리)
        try {
            guildMusicRepository.save(music);
        } catch (Exception e) {
            Throwable t = e.getCause();
            while (t != null && !(t instanceof ConstraintViolationException)) {
                t = t.getCause();
            }
            if (t != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body require element need");
            }
            throw e;
        }
    }
}
