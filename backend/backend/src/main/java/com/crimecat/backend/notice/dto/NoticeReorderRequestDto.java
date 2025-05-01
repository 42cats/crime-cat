package com.crimecat.backend.notice.dto;

import lombok.Getter;

@Getter
public class NoticeReorderRequestDto {
  private String uuid;
  private Boolean isPinned;
  private Integer orderIdx;
}
