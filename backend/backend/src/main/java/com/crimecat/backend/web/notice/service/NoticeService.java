package com.crimecat.backend.web.notice.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.notice.domain.Notices;
import com.crimecat.backend.web.notice.dto.NoticeResponseDto;
import com.crimecat.backend.web.notice.dto.NoticeSummaryResponseDto;
import com.crimecat.backend.web.notice.dto.PageResultDto;
import com.crimecat.backend.web.notice.repository.NoticeRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoticeService {

  private final NoticeRepository noticeRepository;



  public PageResultDto<NoticeSummaryResponseDto> getNotice(Integer limit, Integer page){
    Pageable pageable = PageRequest.of(page,limit);
    Page<Notices> noticePage = noticeRepository.findAllNoticesOrdered(pageable);
    Page<NoticeSummaryResponseDto> dtoPage = noticePage.map(NoticeSummaryResponseDto::from);
    return PageResultDto.from(dtoPage);
  }

  public NoticeResponseDto getNoticeDetail(String id) {
      UUID uuid;
      try {
        uuid = UUID.fromString(id);
      } catch (IllegalArgumentException e) {
        throw ErrorStatus.INVALID_INPUT.asServiceException();
      }

      Notices notices = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);

      return NoticeResponseDto.builder()
          .id(notices.getId().toString())
          .title(notices.getTitle())
          .content(notices.getContent())
          .createdAt(notices.getCreatedAt())
          .isPinned(notices.getIsPinned())
          .noticeType(notices.getNoticeType())
          .summary(notices.getSummary())
          .updatedAt(notices.getUpdatedAt())
          .build();
    }

}
