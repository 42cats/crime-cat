package com.crimecat.backend.notice.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.notice.domain.Notice;
import com.crimecat.backend.notice.dto.NoticeResponseDto;
import com.crimecat.backend.notice.dto.NoticeSummaryResponseDto;
import com.crimecat.backend.notice.dto.PageResultDto;
import com.crimecat.backend.notice.repository.NoticeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NoticeService {

  private final NoticeRepository noticeRepository;



  @Transactional(readOnly = true)
  public PageResultDto<NoticeSummaryResponseDto> getNotice(Integer limit, Integer page){
    Pageable pageable = PageRequest.of(page,limit);
    Page<Notice> noticePage = noticeRepository.findAllNoticesOrdered(pageable);
    Page<NoticeSummaryResponseDto> dtoPage = noticePage.map(NoticeSummaryResponseDto::from);
    return PageResultDto.from(dtoPage);
  }

  @Transactional(readOnly = true)
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
