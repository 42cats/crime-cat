package com.crimecat.backend.point.sort;

import com.crimecat.backend.utils.sort.SortType;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

public enum PointHistorySortType implements SortType {
  LATEST(Sort.by(Direction.DESC, "usedAt")),
  OLDEST(Sort.by(Direction.ASC, "usedAt")),
  AMOUNT_DESC(Sort.by(Direction.DESC, "amount")),
  AMOUNT_ASC(Sort.by(Direction.ASC, "amount")),
  BALANCE_DESC(Sort.by(Direction.DESC, "balanceAfter")),
  BALANCE_ASC(Sort.by(Direction.ASC, "balanceAfter")),
  ;

  private final Sort sort;

  PointHistorySortType(Sort sort) {
    this.sort = sort;
  }

  @Override
  public Sort getSort() {
    return sort;
  }
}
