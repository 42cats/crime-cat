package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.CrimesceneTheme;
import com.crimecat.backend.gametheme.domain.EscapeRoomTheme;
import com.crimecat.backend.gametheme.domain.GameTheme;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class GameThemeDto {
    private UUID id;
    private String title;
    private String thumbnail;
    private String summary;
    private int recommendations;
    private int views;
    private int playCount;
    private UUID author;
    private int playersMin;
    private int playersMax;
    private int playTimeMin;
    private int playTimeMax;
    private int price;
    private int difficulty;
    private Set<String> tags;
    private boolean recommendationEnabled;
    private String type;

    public static GameThemeDto from(GameTheme theme) {
        if (theme instanceof CrimesceneTheme) {
            return CrimesceneThemeDto.from((CrimesceneTheme) theme);
        } else if (theme instanceof EscapeRoomTheme) {
            return EscapeRoomThemeDto.from((EscapeRoomTheme) theme);
        }
        
        // 기본 GameTheme은 abstract이므로 이 부분은 실행되지 않아야 함
        throw new IllegalArgumentException("Unknown theme type: " + theme.getClass().getName());
    }
}
