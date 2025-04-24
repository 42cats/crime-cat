package com.crimecat.backend.web.notice.dto;

import com.crimecat.backend.web.notice.domain.NoticeType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NoticeRequestDto {
  private String title;
  private String content;
  private String summary;
  private NoticeType noticeType;
  private Boolean isPinned;
}
