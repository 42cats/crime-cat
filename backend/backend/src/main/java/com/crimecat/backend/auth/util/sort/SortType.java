package com.crimecat.backend.auth.util.sort;

import org.springframework.data.domain.Sort;

public interface SortType {
  Sort getSort();
}