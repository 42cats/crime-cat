package com.crimecat.backend.web.notice.dto;

import lombok.Getter;

@Getter
public class NoticeReorderRequestDto {
  private String uuid;
  private Boolean isPinned;
  private Integer orderIdx;
}
