package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class PasswordNoteListResponseDto {
    private String message;
    private List<PasswordNoteDto> passwordNotes;
}
