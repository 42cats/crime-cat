package com.crimecat.backend.bot.guild.service;

import com.crimecat.backend.bot.guild.dto.PasswordNoteDto;
import com.crimecat.backend.bot.guild.dto.PatchPasswordNoteRequestDto;
import com.crimecat.backend.bot.guild.dto.SavePasswordNoteRequestDto;

import java.util.List;

public interface PasswordNoteService {
    PasswordNoteDto save(String guildId, SavePasswordNoteRequestDto request);
    void delete(String guildId, String passwordKey);
    List<PasswordNoteDto> findAllByGuildId(String guildId);
    PasswordNoteDto findOne(String guildId, String passwordKey);
    PasswordNoteDto update(String guildId, PatchPasswordNoteRequestDto request);
}
