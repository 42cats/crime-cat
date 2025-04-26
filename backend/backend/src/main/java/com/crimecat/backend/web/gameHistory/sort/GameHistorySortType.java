package com.crimecat.backend.web.gameHistory.sort;

import com.crimecat.backend.auth.util.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum GameHistorySortType implements SortType {
  LATEST(Sort.by(Sort.Direction.DESC, "createdAt")),
  OLDEST(Sort.by(Direction.ASC, "createdAt")),
  NAME(Sort.by(Direction.ASC, "guild.name")),
  ;

  private final Sort sort;

  GameHistorySortType(Sort sort) {
    this.sort = sort;
  }

  @Override
  public Sort getSort() {
    return sort;
  }
}
