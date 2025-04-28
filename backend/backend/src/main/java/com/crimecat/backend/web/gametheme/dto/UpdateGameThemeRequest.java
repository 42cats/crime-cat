package com.crimecat.backend.web.gametheme.dto;

import com.crimecat.backend.web.gametheme.domain.GameTheme;
import com.crimecat.backend.web.gametheme.domain.ThemeType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.Set;
import java.util.function.Consumer;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXTERNAL_PROPERTY,
        property = "type"  // 이 필드를 기반으로 자식 클래스를 구분
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = UpdateCrimesceneThemeRequest.class, name = ThemeType.Values.CRIMESCENE),
})
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class UpdateGameThemeRequest {
    private String title;
    private String summary;
    private String thumbnail;
    private Set<String> tags;
    private String content;
    private Integer playerMin;
    private Integer playerMax;
    private Integer playTimeMin;
    private Integer playTimeMax;
    private Integer price;
    private Integer difficulty;
    private Boolean publicStatus;
    private String type;

    protected <T> void set(T object, Consumer<T> setter) {
        if (object != null) {
            setter.accept(object);
        }
    }

    protected <T> void set(JsonNullable<T> object, Consumer<T> setter) {
        if (object.isPresent()) {
            setter.accept(object.get());
        }
    }

    public void update(GameTheme gameTheme) {
        set(title, gameTheme::setTitle);
        set(summary, gameTheme::setSummary);
        set(tags, gameTheme::setTags);
        set(content, gameTheme::setContent);
        set(playerMin, gameTheme::setPlayerMin);
        set(playerMax, gameTheme::setPlayerMax);
        set(playTimeMin, gameTheme::setPlayTimeMin);
        set(playTimeMax, gameTheme::setPlayTimeMax);
        set(price, gameTheme::setPrice);
        set(difficulty, gameTheme::setDifficulty);
        set(publicStatus, gameTheme::setPublicStatus);
        if (thumbnail == null) {
            gameTheme.setThumbnail(null);
        }
    }
}
