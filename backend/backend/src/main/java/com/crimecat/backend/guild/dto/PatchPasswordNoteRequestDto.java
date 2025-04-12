package com.crimecat.backend.guild.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class PatchPasswordNoteRequestDto {

    @NotBlank
    private UUID uuid;

    @NotBlank
    private String channelSnowflake;

    @NotBlank
    private String passwordKey;

    @NotBlank
    @Size(max = 2000)
    private String content;
}
