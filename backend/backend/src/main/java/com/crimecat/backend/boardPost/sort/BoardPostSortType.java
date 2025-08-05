package com.crimecat.backend.boardPost.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;

public enum BoardPostSortType implements SortType {
    LATEST(Sort.by(Sort.Direction.DESC, "isPinned")
            .and(Sort.by(Sort.Direction.DESC, "createdAt"))),
    OLDEST(Sort.by(Sort.Direction.DESC, "isPinned")
            .and(Sort.by(Sort.Direction.ASC, "createdAt"))),
    VIEWS(Sort.by(Sort.Direction.DESC, "isPinned")
            .and(Sort.by(Sort.Direction.DESC, "views"))),
    LIKES(Sort.by(Sort.Direction.DESC, "isPinned")
            .and(Sort.by(Sort.Direction.DESC, "likes")));

    private final Sort sort;

    BoardPostSortType(Sort sort) {
        this.sort = sort;
    }

    @Override
    public Sort getSort() {
        return sort;
    }
}