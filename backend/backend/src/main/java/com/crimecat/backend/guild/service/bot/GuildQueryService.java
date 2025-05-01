package com.crimecat.backend.guild.service.bot;

import com.crimecat.backend.guild.domain.Guild;
import com.crimecat.backend.guild.repository.GuildRepository;
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
