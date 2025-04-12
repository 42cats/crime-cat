package com.crimecat.backend.guild.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordNoteDto {
    private String channelSnowflake;
    private String passwordKey;
    private String content;
}
