package com.crimecat.backend.web.notice.dto;

import com.crimecat.backend.web.notice.domain.NoticeType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NoticeResponseDto {
  private String id;
  private String title;
  private String content;
  private String summary;
  private NoticeType noticeType;
  private Boolean isPinned;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
