package com.crimecat.backend.gametheme.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;

public enum GameThemeSortType implements SortType {
    LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
    OLDEST(LATEST.getSort().reverse()),
    RECOMMENDATION_ENABLED(Sort.by(Sort.Direction.DESC, "recommendationEnabled")),
    LIKE(Sort.by("recommendations")),
    LIKE_DESC(LIKE.getSort().reverse()),
    VIEW(Sort.by("views")),
    VIEW_DESC(VIEW.getSort().reverse()),
    PRICE(Sort.by("price")),
    PRICE_DESC(PRICE.getSort().reverse()),
    PLAYTIME(Sort.by("playTimeMax", "playTimeMin")),
    PLAYTIME_DESC(PLAYTIME.getSort().reverse()),
    DEFAULT(Sort.by(Sort.Direction.DESC, "recommendationEnabled")
            .and(Sort.by(Sort.Direction.DESC, "createdAt"))),
    ;

    private final Sort sort;

    GameThemeSortType(Sort sort) {
        this.sort = sort;
    }

    @Override
    public Sort getSort() {
        return sort;
    }
}
