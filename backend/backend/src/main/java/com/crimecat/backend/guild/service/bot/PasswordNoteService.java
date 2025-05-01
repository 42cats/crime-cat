package com.crimecat.backend.guild.service.bot;

import com.crimecat.backend.guild.dto.bot.PasswordNoteDto;
import com.crimecat.backend.guild.dto.bot.PatchPasswordNoteRequestDto;
import com.crimecat.backend.guild.dto.bot.SavePasswordNoteRequestDto;

import java.util.List;

public interface PasswordNoteService {
    PasswordNoteDto save(String guildId, SavePasswordNoteRequestDto request);
    void delete(String guildId, String passwordKey);
    List<PasswordNoteDto> findAllByGuildId(String guildId);
    PasswordNoteDto findOne(String guildId, String passwordKey);
    PasswordNoteDto update(String guildId, PatchPasswordNoteRequestDto request);
}
