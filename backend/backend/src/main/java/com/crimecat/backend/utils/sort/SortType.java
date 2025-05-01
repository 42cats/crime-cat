package com.crimecat.backend.utils.sort;

import org.springframework.data.domain.Sort;

public interface SortType {
  Sort getSort();
}