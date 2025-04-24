package com.crimecat.backend.web.notice.dto;

import com.crimecat.backend.web.notice.domain.Notice;
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

  public static NoticeSummaryResponseDto from(Notice notice) {
    return NoticeSummaryResponseDto.builder()
        .id(notice.getId().toString())
        .title(notice.getTitle())
        .summary(notice.getSummary())
        .noticeType(notice.getNoticeType())
        .updatedAt(notice.getUpdatedAt())
        .build();
  }

}
