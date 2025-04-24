package com.crimecat.backend.web.notice.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.notice.domain.Notice;
import com.crimecat.backend.web.notice.dto.NoticeResponseDto;
import com.crimecat.backend.web.notice.dto.NoticeSummaryResponseDto;
import com.crimecat.backend.web.notice.repository.NoticeRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoticeService {

  private final NoticeRepository noticeRepository;



  public List<NoticeSummaryResponseDto> getNotice(Integer limit, Integer page){
    Pageable pageable = PageRequest.of(page,limit);

    return noticeRepository.findAllNoticesOrdered(pageable).stream()
        .map(v -> NoticeSummaryResponseDto
            .builder()
            .noticeType(v.getNoticeType())
            .id(v.getId().toString())
            .title(v.getTitle())
            .summary(v.getSummary())
            .updatedAt(v.getUpdatedAt())
            .build())
        .toList();
  }

  public NoticeResponseDto getNoticeDetail(String id) {
      UUID uuid;
      try {
        uuid = UUID.fromString(id);
      } catch (IllegalArgumentException e) {
        throw ErrorStatus.INVALID_INPUT.asServiceException();
      }

      Notice notice = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);

      return NoticeResponseDto.builder()
          .id(notice.getId().toString())
          .title(notice.getTitle())
          .content(notice.getContent())
          .createdAt(notice.getCreatedAt())
          .isPinned(notice.getIsPinned())
          .noticeType(notice.getNoticeType())
          .summary(notice.getSummary())
          .updatedAt(notice.getUpdatedAt())
          .build();
    }

}
