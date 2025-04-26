package com.crimecat.backend.web.admin.service;

import com.crimecat.backend.exception.ErrorStatus;
import com.crimecat.backend.web.notice.domain.Notices;
import com.crimecat.backend.web.notice.dto.NoticeReorderRequestDto;
import com.crimecat.backend.web.notice.dto.NoticeRequestDto;
import com.crimecat.backend.web.notice.repository.NoticeRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

  private final NoticeRepository noticeRepository;

  @Transactional
  public void addNotice(NoticeRequestDto noticeRequestDto) {
    try{
      Notices notices = Notices.builder()
          .title(noticeRequestDto.getTitle())
          .content(noticeRequestDto.getContent())
          .noticeType(noticeRequestDto.getNoticeType())
          .summary(noticeRequestDto.getSummary())
          .isPinned(noticeRequestDto.getIsPinned())
          .build();
      noticeRepository.save(notices);
      } catch (Exception e) {
        throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
  }

  @Transactional
  public void patchNotice(UUID uuid, NoticeRequestDto noticeRequestDto){
      Notices notices = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);
    try{
      notices.setNoticeType(noticeRequestDto.getNoticeType());
      notices.setSummary(noticeRequestDto.getSummary());
      notices.setContent(noticeRequestDto.getContent());
      notices.setTitle(noticeRequestDto.getTitle());
      notices.setIsPinned(noticeRequestDto.getIsPinned());

      noticeRepository.save(notices);

    }
    catch (Exception e) {
          throw ErrorStatus.INVALID_INPUT.asServiceException();
    }
  }

  @Transactional
  public void deleteNotice(UUID uuid) {
    noticeRepository.deleteById(uuid);
  }

  @Transactional
  public void reorderNotice(List<NoticeReorderRequestDto> noticeReorderRequestDtoList) {

    for (NoticeReorderRequestDto noticeReorderRequestDto : noticeReorderRequestDtoList) {
      UUID uuid = UUID.fromString(noticeReorderRequestDto.getUuid());
      Notices notices = noticeRepository.findById(uuid)
          .orElseThrow(ErrorStatus.RESOURCE_NOT_FOUND::asServiceException);
      if(noticeReorderRequestDto.getIsPinned()){
        notices.setOrderIdx(noticeReorderRequestDto.getOrderIdx());
      }
      else{
        notices.setIsPinned(false);
        notices.setOrderIdx(0);
      }
    }
  }
}
