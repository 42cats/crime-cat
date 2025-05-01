package com.crimecat.backend.gametheme.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Data
public class AddCrimesceneThemeRequest extends AddGameThemeRequest {
    private UUID makerTeamsId;
    private String guildSnowflake;
    private Map<String, Object> extra;
}
