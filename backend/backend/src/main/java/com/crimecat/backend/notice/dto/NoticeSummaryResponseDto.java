package com.crimecat.backend.notice.dto;

import com.crimecat.backend.notice.domain.Notice;
import com.crimecat.backend.notice.domain.NoticeType;
import java.io.Serializable;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class NoticeSummaryResponseDto implements Serializable {
  private static final long serialVersionUID = 1L;
  private String id;
  private String title;
  private String summary;
  private NoticeType noticeType;
  private LocalDateTime updatedAt;
  private LocalDateTime createdAt;
  private Boolean isPinned;

  public static NoticeSummaryResponseDto from(Notice notice) {
    return NoticeSummaryResponseDto.builder()
        .id(notice.getId().toString())
        .title(notice.getTitle())
        .summary(notice.getSummary())
        .isPinned(notice.getIsPinned())
        .createdAt(notice.getCreatedAt())
        .noticeType(notice.getNoticeType())
        .updatedAt(notice.getUpdatedAt())
        .build();
  }

}
