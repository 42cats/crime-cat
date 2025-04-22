package com.crimecat.backend.bot.guild.service;

import com.crimecat.backend.bot.guild.domain.Guild;
import com.crimecat.backend.bot.guild.repository.GuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GuildQueryService {
    private final GuildRepository guildRepository;

    public boolean existsBySnowflake(String snowflake) {
        Guild guild = guildRepository.findBySnowflake(snowflake).orElse(null);
        if (guild == null || guild.isWithdraw()) {
            return false;
        }
        return true;
    }
}
