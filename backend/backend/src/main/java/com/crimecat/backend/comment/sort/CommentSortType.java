package com.crimecat.backend.comment.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum CommentSortType implements SortType {
  LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
  OLDEST(Sort.by(Direction.ASC, "createdAt")),
  POPULAR(Sort.by(Direction.DESC, "likes").and(Sort.by(Direction.DESC, "createdAt"))),
  ;

  private final Sort sort;

  CommentSortType(Sort sort) {
    this.sort = sort;
  }

  @Override
  public Sort getSort() {
    return sort;
  }
}