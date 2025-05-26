package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordNoteResponseDto {
    private String message;
    private PasswordNoteDto passwordNote;
}
