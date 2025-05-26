package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordNoteListResponseDto {
    private String message;
    private List<PasswordNoteDto> passwordNotes;
}
