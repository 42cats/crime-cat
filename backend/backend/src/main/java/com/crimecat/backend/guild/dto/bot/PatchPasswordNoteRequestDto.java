package com.crimecat.backend.guild.dto.bot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatchPasswordNoteRequestDto {

    @NotNull
    private UUID uuid;

    @NotBlank
    private String channelSnowflake;

    @NotBlank
    private String passwordKey;

    @NotBlank
    @Size(max = 2000)
    private String content;
}
