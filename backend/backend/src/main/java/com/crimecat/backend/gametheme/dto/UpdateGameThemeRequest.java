package com.crimecat.backend.gametheme.dto;

import com.crimecat.backend.gametheme.domain.GameTheme;
import com.crimecat.backend.gametheme.enums.ThemeType;
import com.crimecat.backend.gametheme.validator.MinMaxCheck;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.Set;
import java.util.function.Consumer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Range;
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
@MinMaxCheck(min = "playerMin", max = "playerMax", message = "인원수 최소값이 최대값보다 큽니다.")
@MinMaxCheck(min = "playtimeMin", max = "playtimeMax", message = "플레이 시간 최소값이 최대값보다 큽니다.")
public class UpdateGameThemeRequest {
    @Size(min = 1)
    private String title;
    @Size(min = 1)
    private String summary;
    private JsonNullable<String> thumbnail = JsonNullable.undefined();
    @Size(min = 1)
    private Set<String> tags;
    @Size(min = 1)
    private String content;
    @Min(1)
    private Integer playerMin;
    private Integer playerMax;
    @Min(1)
    private Integer playtimeMin;
    private Integer playtimeMax;
    @Min(0)
    private Integer price;
    @Range(min = 1, max = 5)
    private Integer difficulty;
    private Boolean publicStatus;
    private Boolean recommendationEnabled;
    private Boolean commentEnabled;

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
        set(playtimeMin, gameTheme::setPlayTimeMin);
        set(playtimeMax, gameTheme::setPlayTimeMax);
        set(price, gameTheme::setPrice);
        set(difficulty, gameTheme::setDifficulty);
        set(publicStatus, gameTheme::setPublicStatus);
        set(recommendationEnabled, gameTheme::setRecommendationEnabled);
        set(commentEnabled, gameTheme::setCommentEnabled);
        if (thumbnail.isPresent() && thumbnail.get() == null) {
            gameTheme.setThumbnail(null);
        }
        gameTheme.update();
    }
}
