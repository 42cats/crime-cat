package com.crimecat.backend.gametheme.dto.filter;

import com.crimecat.backend.gametheme.enums.RangeType;
import com.crimecat.backend.gametheme.sort.GameThemeSortType;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GetGameThemesFilter {
//    private Integer playerMin;
//    private Integer playerMax;
//    private Integer priceMin;
//    private Integer priceMax;
//    private Integer playtimeMin;
//    private Integer playtimeMax;
//    private Integer difficultyMin;
//    private Integer difficultyMax;

    private String category;
    private int limit = 9;
    private int page = 0;
    private String sort = GameThemeSortType.DEFAULT.name();
    private String keyword;
    private List<RangeFilter> ranges = new ArrayList<>();
    private Boolean hasPlayed; // true: 플레이한 테마만, false: 플레이하지 않은 테마만, null: 전체

    public GetGameThemesFilter(Integer playerMax, Integer playerMin, Integer priceMin, Integer priceMax,
                               Integer playtimeMin, Integer playtimeMax, Integer difficultyMin, Integer difficultyMax) {
        ranges.add(RangeFilter.of(playerMin, playerMax, RangeType.PLAYER));
        ranges.add(RangeFilter.of(priceMin, priceMax, RangeType.PRICE));
        ranges.add(RangeFilter.of(playtimeMin, playtimeMax, RangeType.PLAYTIME));
        ranges.add(RangeFilter.of(difficultyMin, difficultyMax, RangeType.DIFFICULTY));
    }
}
