package com.crimecat.backend.guild.service;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.dto.GuildDto;
import com.crimecat.backend.guild.repository.GuildRepository;
import com.crimecat.backend.user.service.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuildService {
    private final GuildRepository guildRepository;
    private final UserQueryService userQueryService;

    public GuildDto addGuild(GuildDto guildDto) {
        if (userQueryService.findByUserSnowflake(guildDto.getOwnerSnowflake()) == null) {
            return null;
        }
        if (guildRepository.findBySnowflake(guildDto.getSnowflake()).isPresent()) {
            return null;
        }
        Guild guild = Guild.of(guildDto);
        guildRepository.save(guild);
        return new GuildDto(guild.getSnowflake(), guild.getName(), guild.getOwnerSnowflake());
    }

    public void deleteGuild(String snowflake) {
        if (guildRepository.deleteBySnowflake(snowflake) == 0) {
            throw new RuntimeException();
        }
    }
}
