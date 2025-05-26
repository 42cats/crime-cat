package com.crimecat.backend.guild.dto.bot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SavePasswordNoteRequestDto {

    @NotBlank
    private String channelSnowflake;

    @NotBlank
    private String passwordKey;

    @NotBlank
    @Size(max = 2000)
    private String content;
}
