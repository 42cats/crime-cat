package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.openapitools.jackson.nullable.JsonNullable;

import java.util.Map;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class UpdateCrimesceneThemeRequest extends UpdateGameThemeRequest{
    private JsonNullable<UUID> makerTeamsId;
    private JsonNullable<String> guildSnowflake;
    private Map<String, Object> extra;



    public void update(GameTheme gameTheme) {
        if (!(gameTheme instanceof CrimesceneTheme)) {
            throw ErrorStatus.INVALID_INPUT.asDomainException();
        }
        super.update(gameTheme);
        CrimesceneTheme crimesceneTheme = (CrimesceneTheme) gameTheme;
        set(makerTeamsId, crimesceneTheme::setTeamId);
        set(guildSnowflake, crimesceneTheme::setGuildSnowflake);
        set(extra, crimesceneTheme::setExtra);
    }
}
