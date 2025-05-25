package com.crimecat.backend.boardPost.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum BoardPostSortType implements SortType {
    LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
    OLDEST(Sort.by(Direction.ASC, "createdAt")),
    ;

    private final Sort sort;

    BoardPostSortType(Sort sort) {
        this.sort = sort;
    }

    @Override
    public Sort getSort() {
        return sort;
    }
}