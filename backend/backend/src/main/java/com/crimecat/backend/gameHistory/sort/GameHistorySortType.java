package com.crimecat.backend.gameHistory.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum GameHistorySortType implements SortType {
  LATEST(Sort.by(Sort.Direction.DESC, "created_at")),
  OLDEST(Sort.by(Direction.ASC, "created_at")),
  GUILDNAME(Sort.by(Direction.ASC, "guild.name")),
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
