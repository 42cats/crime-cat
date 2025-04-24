package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.ThemeType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Data
public class AddCrimesceneThemeRequest extends AddGameThemeRequest {
    private UUID makerTeamsId;
    private String guildSnowflake;
    private Map<String, Object> extra;
}
