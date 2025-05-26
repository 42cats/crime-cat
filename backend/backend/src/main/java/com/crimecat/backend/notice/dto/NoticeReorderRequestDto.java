package com.crimecat.backend.notice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NoticeReorderRequestDto {
  private String uuid;
  private Boolean isPinned;
  private Integer orderIdx;
}
