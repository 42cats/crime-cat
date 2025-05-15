package com.crimecat.backend.gametheme.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;

public enum GameThemeSortType implements SortType {
    LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
    RECOMMENDATION_ENABLED(Sort.by(Sort.Direction.DESC, "recommendationEnabled")),
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
