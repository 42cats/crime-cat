package com.crimecat.backend.guild.exception;

import com.crimecat.backend.guild.dto.bot.GuildDto;

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
