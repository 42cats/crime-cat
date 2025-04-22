package com.crimecat.backend.bot.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PasswordNoteResponseDto {
    private String message;
    private PasswordNoteDto passwordNote;
}
