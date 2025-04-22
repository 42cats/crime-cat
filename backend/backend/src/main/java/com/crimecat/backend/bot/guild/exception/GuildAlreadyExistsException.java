package com.crimecat.backend.bot.guild.exception;

import com.crimecat.backend.bot.guild.dto.GuildDto;

public class GuildAlreadyExistsException extends RuntimeException {
    private final GuildDto guild;

    public GuildAlreadyExistsException(GuildDto guildDto) {
        super("already created");
        this.guild = guildDto;
    }

    public GuildDto getGuild() {
        return guild;
    }
}
