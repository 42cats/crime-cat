package com.crimecat.backend.auth.util.sort;

import java.util.List;
import org.springframework.data.domain.Sort;

public class SortUtil {
  public static <T extends SortType> Sort combineSorts(List<T> sortTypes) {
    return sortTypes.stream()
        .map(SortType::getSort)
        .reduce(Sort::and)
        .orElse(Sort.by(Sort.Direction.DESC, "createdAt"));
  }
}