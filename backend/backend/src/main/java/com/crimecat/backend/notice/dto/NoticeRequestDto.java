package com.crimecat.backend.notice.dto;

import com.crimecat.backend.notice.domain.NoticeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeRequestDto {
  private String title;
  private String content;
  private String summary;
  private NoticeType noticeType;
  private Boolean isPinned;
}
