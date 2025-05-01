package com.crimecat.backend.notice.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public class PageResultDto<T> {
  private List<T> content;
  private int page;
  private int size;
  private int totalPages;
  private long totalElements;
  private boolean hasNext;
  private boolean hasPrevious;

  // 생성자
  public PageResultDto(List<T> content, int page, int size, int totalPages,
      long totalElements, boolean hasNext, boolean hasPrevious) {
    this.content = content;
    this.page = page;
    this.size = size;
    this.totalPages = totalPages;
    this.totalElements = totalElements;
    this.hasNext = hasNext;
    this.hasPrevious = hasPrevious;
  }

  // 정적 팩토리 메서드
  public static <T> PageResultDto<T> from(Page<T> page) {
    return new PageResultDto<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalPages(),
        page.getTotalElements(),
        page.hasNext(),
        page.hasPrevious()
    );
  }

  // Getter
  public List<T> getContent() {
    return content;
  }

  public int getPage() {
    return page;
  }

  public int getSize() {
    return size;
  }

  public int getTotalPages() {
    return totalPages;
  }

  public long getTotalElements() {
    return totalElements;
  }

  public boolean isHasNext() {
    return hasNext;
  }

  public boolean isHasPrevious() {
    return hasPrevious;
  }
}
