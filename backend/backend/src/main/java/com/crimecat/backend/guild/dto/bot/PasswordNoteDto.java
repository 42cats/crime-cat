package com.crimecat.backend.guild.dto.bot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordNoteDto {
    private UUID uuid;
    private String channelSnowflake;
    private String passwordKey;
    private String content;
}
