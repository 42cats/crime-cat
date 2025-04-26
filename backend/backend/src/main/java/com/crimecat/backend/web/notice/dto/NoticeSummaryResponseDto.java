package com.crimecat.backend.web.notice.dto;

import com.crimecat.backend.web.notice.domain.Notices;
import com.crimecat.backend.web.notice.domain.NoticeType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NoticeSummaryResponseDto {
  private String id;
  private String title;
  private String summary;
  private NoticeType noticeType;
  private LocalDateTime updatedAt;
  private LocalDateTime createdAt;
  private Boolean isPinned;

  public static NoticeSummaryResponseDto from(Notices notices) {
    return NoticeSummaryResponseDto.builder()
        .id(notices.getId().toString())
        .title(notices.getTitle())
        .summary(notices.getSummary())
        .isPinned(notices.getIsPinned())
        .createdAt(notices.getCreatedAt())
        .noticeType(notices.getNoticeType())
        .updatedAt(notices.getUpdatedAt())
        .build();
  }

}
